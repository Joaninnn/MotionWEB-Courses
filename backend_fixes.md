# Правильная реализация WebSocket чата согласно рекомендациям архитектора

## Проблема
Фронтенд уже правильно реализован, но бэкенд нужно исправить согласно рекомендациям:

1. ❌ Неправильно: пересчет счетчиков для всех пользователей
2. ❌ Неправильно: хранение unread_count в БД
3. ✅ Правильно: хранение только last_read_message_id
4. ✅ Правильно: динамический расчет unread

## Правильная реализация бэкенда

### 1. WebSocket handler

```python
@router.websocket("/ws/messages")
async def websocket_endpoint(websocket: WebSocket, token: str, group_id: int):
    # Подключение к WebSocket с токеном и группой
    user_id = get_user_from_token(token)
    
    await websocket.accept()
    
    # ✅ Добавляем пользователя в менеджер активных чатов
    connection_manager.add_connection(user_id, group_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("action") == "set_active_chat":
                target_group_id = data.get("group_id")
                
                # ✅ ПРОВЕРКА УЧАСТИЯ
                if not is_user_in_chat(user_id, target_group_id):
                    await websocket.send_json({"error": "User is not a member of this chat"})
                    continue
                
                # ✅ УСТАНАВЛИВАЕМ АКТИВНЫЙ ЧАТ (без автоматического чтения для всех!)
                connection_manager.set_active_chat(user_id, target_group_id)
                
                # ✅ ПОДТВЕРЖДЕНИЕ
                await websocket.send_json({
                    "event": "active_chat_set", 
                    "group_id": target_group_id
                })
                
            elif data.get("action") == "new_message":
                # Обработка новых сообщений
                await handle_new_message(data, websocket, user_id)
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
        connection_manager.remove_connection(user_id)
```

### 2. Connection Manager

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}  # user_id -> {group_id: websocket}
        self.active_chats: Dict[int, int] = {}  # user_id -> group_id
    
    def add_connection(self, user_id: int, group_id: int, websocket: WebSocket):
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
        self.active_connections[user_id][group_id] = websocket
    
    def remove_connection(self, user_id: int):
        self.active_connections.pop(user_id, None)
        self.active_chats.pop(user_id, None)
    
    def set_active_chat(self, user_id: int, group_id: int):
        self.active_chats[user_id] = group_id
    
    def is_chat_active_for_user(self, user_id: int, group_id: int) -> bool:
        return self.active_chats.get(user_id) == group_id
    
    def get_websocket(self, user_id: int, group_id: int) -> Optional[WebSocket]:
        return self.active_connections.get(user_id, {}).get(group_id)

manager = ConnectionManager()
```

### 3. Обработка новых сообщений

```python
async def handle_new_message(data: dict, websocket: WebSocket, sender_id: int):
    group_id = data.get("group_id")
    message_text = data.get("text")
    
    # Сохраняем сообщение в БД
    message = await save_message_to_db(group_id, sender_id, message_text)
    
    # ✅ АВТОМАТИЧЕСКОЕ ЧТЕНИЕ ДЛЯ АКТИВНЫХ ПОЛЬЗОВАТЕЛЕЙ
    members = await get_chat_members(group_id)
    for member_id in members:
        if member_id != sender_id:  # Не отправляем отправителю
            # Если у пользователя открыт этот чат - отмечаем как прочитанное
            if manager.is_chat_active_for_user(member_id, group_id):
                await mark_message_as_read(member_id, group_id, message.id)
            
            # Отправляем сообщение через WebSocket
            member_ws = manager.get_websocket(member_id, group_id)
            if member_ws:
                try:
                    await member_ws.send_json({
                        "type": "new_message",
                        "message": message.to_dict()
                    })
                except:
                    pass  # WebSocket закрыт
```

### 4. Функция отметки прочтения

```python
async def mark_message_as_read(user_id: int, group_id: int, message_id: int):
    """✅ ПРАВИЛЬНАЯ РЕАЛИЗАЦИЯ - только для одного пользователя"""
    try:
        async with db.begin():  # ✅ ТРАНЗАКЦИЯ
            # ✅ ВАЛИДАЦИЯ
            message_exists = await db.execute(
                "SELECT id FROM message WHERE id = :message_id AND group_id = :group_id",
                {"message_id": message_id, "group_id": group_id}
            ).scalar()
            
            if not message_exists:
                return False
            
            # ✅ ВАЛИДАЦИЯ УЧАСТИЯ
            is_user_member = await db.execute(
                "SELECT 1 FROM people WHERE group_id = :group_id AND user_id = :user_id",
                {"group_id": group_id, "user_id": user_id}
            ).scalar() is not None
            
            if not is_user_member:
                return False
            
            # ✅ ОБНОВЛЕНИЕ ИЛИ СОЗДАНИЕ ЗАПИСИ (только для одного пользователя!)
            await db.execute(text("""
                INSERT INTO chat_read_state (group_id, user_id, last_read_message_id, updated_at)
                VALUES (:group_id, :user_id, :last_read_message_id, CURRENT_TIMESTAMP)
                ON CONFLICT (group_id, user_id) 
                DO UPDATE SET 
                    last_read_message_id = :last_read_message_id, 
                    updated_at = CURRENT_TIMESTAMP
            """), {
                "group_id": group_id,
                "user_id": user_id,
                "last_read_message_id": message_id
            })
            
        return True
        
    except Exception as e:
        logger.error(f"Error marking message as read: {e}")
        return False
```

### 5. HTTP endpoint (оставить как есть)

```python
@router.post("/chats/{group_id}/read")
async def mark_as_read(group_id: int, message_id: int, db: Session, current_user: User):
    try:
        success = await mark_message_as_read(current_user.id, group_id, message_id)
        
        if not success:
            return {"error": "Failed to mark as read", "status": 400}
            
        return {"success": True}
        
    except Exception as e:
        logger.error(f"Error in mark_as_read: {e}")
        return {"error": "Internal server error", "status": 500}
```

### 6. Расчет unread счетчиков (динамический)

```python
async def get_unread_count(db: Session, user_id: int, group_id: int) -> int:
    """✅ ПРАВИЛЬНЫЙ РАСЧЕТ - динамический, без хранения в БД"""
    
    # Получаем последнее прочитанное сообщение
    last_read_id = await db.execute(
        "SELECT last_read_message_id FROM chat_read_state WHERE user_id = :user_id AND group_id = :group_id",
        {"user_id": user_id, "group_id": group_id}
    ).scalar()
    
    # Считаем непрочитанные сообщения
    unread_count = await db.execute(
        """
        SELECT COUNT(*) FROM message 
        WHERE group_id = :group_id 
        AND id > COALESCE(:last_read_id, 0)
        """,
        {"group_id": group_id, "last_read_id": last_read_id or 0}
    ).scalar()
    
    return unread_count or 0
```

## Что НЕ нужно делать

❌ **НЕ ХРАНИТЬ unread_count в таблице chat**
❌ **НЕ ПЕРЕСЧИТЫВАТЬ счетчики для всех пользователей**
❌ **НЕ ДЕЛАТЬ автоматическое чтение для всех участников**

## Что нужно сделать бэкенду

1. ✅ Реализовать ConnectionManager для отслеживания активных чатов
2. ✅ Добавить set_active_chat handler
3. ✅ Добавить автоматическое чтение только для активных пользователей
4. ✅ Использовать динамический расчет unread счетчиков
5. ✅ Оставить HTTP endpoint для ручного отметки прочтения

## Результат

- **Масштабируемость**: O(1) операций на сообщение вместо O(n)
- **Правильная логика**: только активные пользователи видят сообщения как прочитанные
- **Производительность**: нет лишних SELECT COUNT операций
- **Консистентность**: транзакции обеспечивают целостность данных
