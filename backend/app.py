from __future__ import annotations

import hashlib
import os
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Iterable, Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    delete,
    select,
    update,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utcnow().isoformat()


def parse_date(value: str):
    return datetime.fromisoformat(value).date()


def normalize_pin(value: str) -> str:
    return value.strip()


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gati.db")
ENV_PIN = normalize_pin(os.getenv("GATI_PIN", "1234"))
SESSION_DAYS = int(os.getenv("GATI_SESSION_DAYS", "30"))
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("GATI_CORS_ORIGINS", "*").split(",") if origin.strip()]


class Base(DeclarativeBase):
    pass


class SessionToken(Base):
    __tablename__ = "session_tokens"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    token_hash: Mapped[str] = mapped_column(String, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, index=True)


class DailyEntry(Base):
    __tablename__ = "daily_entries"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    item_id: Mapped[str] = mapped_column(ForeignKey("checklist_items.id"), nullable=False, index=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    item = relationship("ChecklistItem")


class ClassSchedule(Base):
    __tablename__ = "class_schedule"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    start_time: Mapped[str] = mapped_column(String, nullable=False)
    end_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    room_or_link: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class TaskCategory(str, Enum):
    assignment = "assignment"
    meeting = "meeting"
    other = "other"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    due_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    due_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    category: Mapped[TaskCategory] = mapped_column(SAEnum(TaskCategory), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def token_from_header(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return authorization.removeprefix("Bearer ").strip()


def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def require_session(
    authorization: str | None = Header(default=None),
    session: Session = Depends(db_session),
) -> Session:
    token = token_from_header(authorization)
    token_hash = hash_token(token)
    now = utcnow().replace(tzinfo=None)
    row = session.scalar(select(SessionToken).where(SessionToken.token_hash == token_hash))
    if not row or row.expires_at < now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    row.last_seen_at = now
    session.commit()
    return session


class PinRequest(BaseModel):
    pin: str


class TokenResponse(BaseModel):
    token: str


class ChecklistItemIn(BaseModel):
    id: Optional[str] = None
    label: str
    created_at: Optional[str] = None
    archived_at: Optional[str] = None
    sort_order: int


class ChecklistItemPatch(BaseModel):
    label: Optional[str] = None
    archived_at: Optional[str] = None
    sort_order: Optional[int] = None


class DailyEntryIn(BaseModel):
    id: Optional[str] = None
    date: str
    item_id: str
    completed: bool
    logged_at: Optional[str] = None


class DailyEntryPatch(BaseModel):
    completed: Optional[bool] = None
    logged_at: Optional[str] = None


class ClassScheduleIn(BaseModel):
    id: Optional[str] = None
    name: str
    day_of_week: int
    start_time: str
    end_time: Optional[str] = None
    room_or_link: Optional[str] = None
    notes: Optional[str] = None
    archived_at: Optional[str] = None


class ClassSchedulePatch(BaseModel):
    name: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room_or_link: Optional[str] = None
    notes: Optional[str] = None
    archived_at: Optional[str] = None


class TaskIn(BaseModel):
    id: Optional[str] = None
    title: str
    due_date: str
    due_time: Optional[str] = None
    category: TaskCategory
    notes: Optional[str] = None
    completed: bool = False
    archived_at: Optional[str] = None


class TaskPatch(BaseModel):
    title: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    category: Optional[TaskCategory] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None
    archived_at: Optional[str] = None


class ChecklistItemOut(BaseModel):
    id: str
    label: str
    createdAt: str
    archivedAt: Optional[str]
    sortOrder: int


class DailyEntryOut(BaseModel):
    id: str
    date: str
    itemId: str
    completed: bool
    loggedAt: str


class ClassScheduleOut(BaseModel):
    id: str
    name: str
    dayOfWeek: int
    startTime: str
    endTime: Optional[str]
    roomOrLink: Optional[str]
    notes: Optional[str]
    archivedAt: Optional[str]


class TaskOut(BaseModel):
    id: str
    title: str
    dueDate: str
    dueTime: Optional[str]
    category: TaskCategory
    notes: Optional[str]
    completed: bool
    archivedAt: Optional[str]


class BootstrapOut(BaseModel):
    checklistItems: list[ChecklistItemOut]
    dailyEntries: list[DailyEntryOut]
    classSchedules: list[ClassScheduleOut]
    tasks: list[TaskOut]


class ImportPayload(BaseModel):
    checklistItems: list[ChecklistItemIn] = Field(default_factory=list)
    dailyEntries: list[DailyEntryIn] = Field(default_factory=list)
    classSchedules: list[ClassScheduleIn] = Field(default_factory=list)
    tasks: list[TaskIn] = Field(default_factory=list)


app = FastAPI(title="Gati API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ALLOWED_ORIGINS == ["*"] else ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def row_to_checklist(item: ChecklistItem) -> ChecklistItemOut:
    return ChecklistItemOut(
        id=item.id,
        label=item.label,
        createdAt=item.created_at.isoformat(),
        archivedAt=item.archived_at.isoformat() if item.archived_at else None,
        sortOrder=item.sort_order,
    )


def row_to_daily(entry: DailyEntry) -> DailyEntryOut:
    return DailyEntryOut(
        id=entry.id,
        date=entry.date.isoformat(),
        itemId=entry.item_id,
        completed=entry.completed,
        loggedAt=entry.logged_at.isoformat(),
    )


def row_to_class(item: ClassSchedule) -> ClassScheduleOut:
    return ClassScheduleOut(
        id=item.id,
        name=item.name,
        dayOfWeek=item.day_of_week,
        startTime=item.start_time,
        endTime=item.end_time,
        roomOrLink=item.room_or_link,
        notes=item.notes,
        archivedAt=item.archived_at.isoformat() if item.archived_at else None,
    )


def row_to_task(item: Task) -> TaskOut:
    return TaskOut(
        id=item.id,
        title=item.title,
        dueDate=item.due_date.isoformat(),
        dueTime=item.due_time,
        category=item.category,
        notes=item.notes,
        completed=item.completed,
        archivedAt=item.archived_at.isoformat() if item.archived_at else None,
    )


def upsert_checklist(session: Session, payload: ChecklistItemIn, item_id: str) -> ChecklistItem:
    row = session.get(ChecklistItem, item_id)
    created_at = datetime.fromisoformat(payload.created_at) if payload.created_at else utcnow()
    archived_at = datetime.fromisoformat(payload.archived_at) if payload.archived_at else None
    if row:
        row.label = payload.label
        row.created_at = created_at
        row.archived_at = archived_at
        row.sort_order = payload.sort_order
    else:
        row = ChecklistItem(
            id=item_id,
            label=payload.label,
            created_at=created_at,
            archived_at=archived_at,
            sort_order=payload.sort_order,
        )
        session.add(row)
    return row


def upsert_daily(session: Session, payload: DailyEntryIn, entry_id: str) -> DailyEntry:
    row = session.get(DailyEntry, entry_id)
    logged_at = datetime.fromisoformat(payload.logged_at) if payload.logged_at else utcnow()
    date_value = parse_date(payload.date)
    if row:
        row.date = date_value
        row.item_id = payload.item_id
        row.completed = payload.completed
        row.logged_at = logged_at
    else:
        row = DailyEntry(
            id=entry_id,
            date=date_value,
            item_id=payload.item_id,
            completed=payload.completed,
            logged_at=logged_at,
        )
        session.add(row)
    return row


def upsert_class(session: Session, payload: ClassScheduleIn, item_id: str) -> ClassSchedule:
    archived_at = datetime.fromisoformat(payload.archived_at) if payload.archived_at else None
    row = session.get(ClassSchedule, item_id)
    if row:
        row.name = payload.name
        row.day_of_week = payload.day_of_week
        row.start_time = payload.start_time
        row.end_time = payload.end_time
        row.room_or_link = payload.room_or_link
        row.notes = payload.notes
        row.archived_at = archived_at
    else:
        row = ClassSchedule(
            id=item_id,
            name=payload.name,
            day_of_week=payload.day_of_week,
            start_time=payload.start_time,
            end_time=payload.end_time,
            room_or_link=payload.room_or_link,
            notes=payload.notes,
            archived_at=archived_at,
        )
        session.add(row)
    return row


def upsert_task(session: Session, payload: TaskIn, item_id: str) -> Task:
    archived_at = datetime.fromisoformat(payload.archived_at) if payload.archived_at else None
    row = session.get(Task, item_id)
    if row:
        row.title = payload.title
        row.due_date = parse_date(payload.due_date)
        row.due_time = payload.due_time
        row.category = payload.category
        row.notes = payload.notes
        row.completed = payload.completed
        row.archived_at = archived_at
    else:
        row = Task(
            id=item_id,
            title=payload.title,
            due_date=parse_date(payload.due_date),
            due_time=payload.due_time,
            category=payload.category,
            notes=payload.notes,
            completed=payload.completed,
            archived_at=archived_at,
        )
        session.add(row)
    return row


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true"}


@app.post("/auth/pin", response_model=TokenResponse)
def auth_pin(payload: PinRequest, session: Session = Depends(db_session)) -> TokenResponse:
    if normalize_pin(payload.pin) != ENV_PIN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect PIN")
    token = uuid4().hex + uuid4().hex
    now = utcnow()
    row = SessionToken(
        id=uuid4().hex,
        token_hash=hash_token(token),
        created_at=now,
        last_seen_at=now,
        expires_at=now + timedelta(days=SESSION_DAYS),
    )
    session.add(row)
    session.commit()
    return TokenResponse(token=token)


@app.get("/bootstrap", response_model=BootstrapOut)
def bootstrap(session: Session = Depends(require_session)) -> BootstrapOut:
    return BootstrapOut(
        checklistItems=[row_to_checklist(item) for item in session.scalars(select(ChecklistItem).order_by(ChecklistItem.sort_order)).all()],
        dailyEntries=[row_to_daily(entry) for entry in session.scalars(select(DailyEntry).order_by(DailyEntry.date, DailyEntry.logged_at)).all()],
        classSchedules=[row_to_class(item) for item in session.scalars(select(ClassSchedule).order_by(ClassSchedule.day_of_week, ClassSchedule.start_time)).all()],
        tasks=[row_to_task(item) for item in session.scalars(select(Task).order_by(Task.due_date, Task.due_time.is_(None), Task.due_time)).all()],
    )


@app.post("/admin/import", response_model=BootstrapOut)
def import_local(payload: ImportPayload, session: Session = Depends(require_session)) -> BootstrapOut:
    for item in payload.checklistItems:
        upsert_checklist(session, item, item_id=item.id or uuid4().hex)
    for item in payload.dailyEntries:
        upsert_daily(session, item, entry_id=item.id or uuid4().hex)
    for item in payload.classSchedules:
        upsert_class(session, item, item_id=item.id or uuid4().hex)
    for item in payload.tasks:
        upsert_task(session, item, item_id=item.id or uuid4().hex)
    session.commit()
    return bootstrap(session)


@app.get("/checklist-items", response_model=list[ChecklistItemOut])
def list_checklist_items(session: Session = Depends(require_session)) -> list[ChecklistItemOut]:
    return [row_to_checklist(item) for item in session.scalars(select(ChecklistItem).order_by(ChecklistItem.sort_order)).all()]


@app.post("/checklist-items", response_model=ChecklistItemOut)
def create_checklist_item(payload: ChecklistItemIn, session: Session = Depends(require_session)) -> ChecklistItemOut:
    row = upsert_checklist(session, payload, uuid4().hex)
    session.commit()
    return row_to_checklist(row)


@app.patch("/checklist-items/{item_id}", response_model=ChecklistItemOut)
def patch_checklist_item(item_id: str, payload: ChecklistItemPatch, session: Session = Depends(require_session)) -> ChecklistItemOut:
    row = session.get(ChecklistItem, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    if payload.label is not None:
        row.label = payload.label
    if payload.sort_order is not None:
        row.sort_order = payload.sort_order
    if payload.archived_at is not None:
        row.archived_at = datetime.fromisoformat(payload.archived_at)
    session.commit()
    return row_to_checklist(row)


@app.get("/daily-entries", response_model=list[DailyEntryOut])
def list_daily_entries(date: str | None = None, session: Session = Depends(require_session)) -> list[DailyEntryOut]:
    query = select(DailyEntry).order_by(DailyEntry.date, DailyEntry.logged_at)
    if date:
        query = query.where(DailyEntry.date == parse_date(date))
    return [row_to_daily(entry) for entry in session.scalars(query).all()]


@app.post("/daily-entries", response_model=DailyEntryOut)
def create_daily_entry(payload: DailyEntryIn, session: Session = Depends(require_session)) -> DailyEntryOut:
    row = upsert_daily(session, payload, uuid4().hex)
    session.commit()
    return row_to_daily(row)


@app.put("/daily-entries/{entry_id}", response_model=DailyEntryOut)
def put_daily_entry(entry_id: str, payload: DailyEntryIn, session: Session = Depends(require_session)) -> DailyEntryOut:
    row = upsert_daily(session, payload, entry_id)
    session.commit()
    return row_to_daily(row)


@app.patch("/daily-entries/{entry_id}", response_model=DailyEntryOut)
def patch_daily_entry(entry_id: str, payload: DailyEntryPatch, session: Session = Depends(require_session)) -> DailyEntryOut:
    row = session.get(DailyEntry, entry_id)
    if not row:
        raise HTTPException(status_code=404, detail="Daily entry not found")
    if payload.completed is not None:
        row.completed = payload.completed
    if payload.logged_at is not None:
        row.logged_at = datetime.fromisoformat(payload.logged_at)
    session.commit()
    return row_to_daily(row)


@app.get("/class-schedules", response_model=list[ClassScheduleOut])
def list_classes(session: Session = Depends(require_session)) -> list[ClassScheduleOut]:
    return [row_to_class(item) for item in session.scalars(select(ClassSchedule).order_by(ClassSchedule.day_of_week, ClassSchedule.start_time)).all()]


@app.post("/class-schedules", response_model=ClassScheduleOut)
def create_class(payload: ClassScheduleIn, session: Session = Depends(require_session)) -> ClassScheduleOut:
    row = upsert_class(session, payload, uuid4().hex)
    session.commit()
    return row_to_class(row)


@app.patch("/class-schedules/{item_id}", response_model=ClassScheduleOut)
def patch_class(item_id: str, payload: ClassSchedulePatch, session: Session = Depends(require_session)) -> ClassScheduleOut:
    row = session.get(ClassSchedule, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Class not found")
    if payload.name is not None:
        row.name = payload.name
    if payload.day_of_week is not None:
        row.day_of_week = payload.day_of_week
    if payload.start_time is not None:
        row.start_time = payload.start_time
    if payload.end_time is not None:
        row.end_time = payload.end_time
    if payload.room_or_link is not None:
        row.room_or_link = payload.room_or_link
    if payload.notes is not None:
        row.notes = payload.notes
    if payload.archived_at is not None:
        row.archived_at = datetime.fromisoformat(payload.archived_at)
    session.commit()
    return row_to_class(row)


@app.get("/tasks", response_model=list[TaskOut])
def list_tasks(session: Session = Depends(require_session)) -> list[TaskOut]:
    return [row_to_task(item) for item in session.scalars(select(Task).order_by(Task.due_date, Task.due_time.is_(None), Task.due_time)).all()]


@app.post("/tasks", response_model=TaskOut)
def create_task(payload: TaskIn, session: Session = Depends(require_session)) -> TaskOut:
    row = upsert_task(session, payload, uuid4().hex)
    session.commit()
    return row_to_task(row)


@app.patch("/tasks/{item_id}", response_model=TaskOut)
def patch_task(item_id: str, payload: TaskPatch, session: Session = Depends(require_session)) -> TaskOut:
    row = session.get(Task, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    if payload.title is not None:
        row.title = payload.title
    if payload.due_date is not None:
        row.due_date = parse_date(payload.due_date)
    if payload.due_time is not None:
        row.due_time = payload.due_time
    if payload.category is not None:
        row.category = payload.category
    if payload.notes is not None:
        row.notes = payload.notes
    if payload.completed is not None:
        row.completed = payload.completed
    if payload.archived_at is not None:
        row.archived_at = datetime.fromisoformat(payload.archived_at)
    session.commit()
    return row_to_task(row)
