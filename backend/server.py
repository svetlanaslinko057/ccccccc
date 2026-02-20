from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request, BackgroundTasks, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import asyncio
from crm_service import CRMService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION = int(os.environ.get('JWT_EXPIRATION_MINUTES', 10080))

# Create the main app
app = FastAPI(title="Global Marketplace API")
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize CRM Service
crm_service = CRMService(db)

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str = "customer"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    company_name: Optional[str] = None
    verified: bool = False
    # Address and delivery fields
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    delivery_method: Optional[str] = "nova_poshta"
    np_department: Optional[str] = None
    delivery_notes: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "customer"
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    parent_id: Optional[str] = None
    icon: Optional[str] = 'Smartphone'  # Icon name for category (lucide-react icon names)
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    slug: str
    parent_id: Optional[str] = None
    icon: Optional[str] = 'Smartphone'
    image_url: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    title: str
    slug: str
    description: str
    description_html: Optional[str] = None
    short_description: Optional[str] = None
    category_id: str
    category_name: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    currency: str = "USD"
    stock_level: int = 0
    images: List[str] = []
    videos: Optional[List[str]] = []
    specifications: Optional[List[Dict[str, Any]]] = []
    status: str = "published"
    rating: float = 0.0
    reviews_count: int = 0
    installment_months: Optional[int] = None
    installment_available: bool = False
    views_count: int = 0
    is_bestseller: bool = False  # Хит продаж
    is_featured: bool = False  # Рекомендуемый
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    description: str
    description_html: Optional[str] = None
    short_description: Optional[str] = None
    category_id: str
    category_name: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    stock_level: int = 0
    images: List[str] = []
    videos: Optional[List[str]] = []
    specifications: Optional[List[Dict[str, Any]]] = []
    status: str = "published"
    installment_months: Optional[int] = None
    installment_available: bool = False

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    description_html: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    stock_level: Optional[int] = None
    images: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    specifications: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    is_bestseller: Optional[bool] = None
    is_featured: Optional[bool] = None

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    featured: bool = False

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

class ReviewWithProduct(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    product_name: str
    user_id: str
    user_name: str
    user_email: str
    rating: int
    comment: str
    created_at: datetime

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1

class OrderItem(BaseModel):
    product_id: str
    title: str
    quantity: int
    price: float
    seller_id: str

class ShippingAddress(BaseModel):
    street: str
    city: str
    state: str
    postal_code: str
    country: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    buyer_id: str
    items: List[OrderItem]
    total_amount: float
    currency: str = "USD"
    shipping_address: ShippingAddress
    status: str = "pending"
    payment_status: str = "pending"
    payment_method: Optional[str] = None
    payment_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    shipping_address: ShippingAddress

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    session_id: str
    amount: float
    currency: str
    payment_status: str = "pending"
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIDescriptionRequest(BaseModel):
    product_title: str
    category: str
    key_features: Optional[List[str]] = []

class AIDescriptionResponse(BaseModel):
    description: str
    short_description: str

class ContactRequest(BaseModel):
    name: str
    phone: str
    message: str

class HeroSlide(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    type: str = "banner"  # "banner" or "product"
    product_id: Optional[str] = None
    image_url: Optional[str] = None
    background_color: Optional[str] = None
    background_gradient: Optional[str] = None
    promo_text: Optional[str] = None
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    countdown_enabled: bool = False
    countdown_end_date: Optional[datetime] = None
    order: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HeroSlideCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    type: str = "banner"
    product_id: Optional[str] = None
    image_url: Optional[str] = None
    background_color: Optional[str] = None
    background_gradient: Optional[str] = None
    promo_text: Optional[str] = None
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    countdown_enabled: bool = False
    countdown_end_date: Optional[datetime] = None
    order: int = 0
    active: bool = True

class HeroSlideUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    product_id: Optional[str] = None
    image_url: Optional[str] = None
    background_color: Optional[str] = None
    background_gradient: Optional[str] = None
    promo_text: Optional[str] = None
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    countdown_enabled: Optional[bool] = None
    countdown_end_date: Optional[datetime] = None
    order: Optional[int] = None
    active: Optional[bool] = None

# ============= CRM MODELS =============

class CustomerNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    author_id: str
    author_name: str
    note: str
    type: str = "general"  # general, call, email, meeting, complaint
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerNoteCreate(BaseModel):
    customer_id: str
    note: str
    type: str = "general"

class CRMTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    customer_id: Optional[str] = None
    assigned_to: str
    due_date: Optional[datetime] = None
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "pending"  # pending, in_progress, completed, cancelled
    type: str = "follow_up"  # follow_up, call, email, meeting
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class CRMTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    customer_id: Optional[str] = None
    assigned_to: str
    due_date: Optional[datetime] = None
    priority: str = "medium"
    type: str = "follow_up"

class CRMTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    source: str = "website"  # website, referral, social, ads, other
    status: str = "new"  # new, contacted, qualified, converted, lost
    interest: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    converted_to_customer_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    source: str = "website"
    interest: Optional[str] = None
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = None

class PopularCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    icon: Optional[str] = None  # lucide-react icon name
    image_url: Optional[str] = None  # URL изображения категории
    category_id: Optional[str] = None  # ID категории товаров для фильтрации
    product_ids: List[str] = []  # List of product IDs to display in this category
    order: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PopularCategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[str] = None
    product_ids: List[str] = []
    order: int = 0
    active: bool = True

class PopularCategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[str] = None
    product_ids: Optional[List[str]] = None
    order: Optional[int] = None
    active: Optional[bool] = None

class ActualOffer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None  # Описание предложения
    description_html: Optional[str] = None  # HTML описание
    image_url: str
    banner_image_url: Optional[str] = None  # Баннер для страницы предложения
    link_url: str  # URL or /offer/{id}
    product_ids: List[str] = []  # Товары в этом предложении
    background_color: Optional[str] = "#ffffff"
    text_color: Optional[str] = "#000000"
    position: int = 0  # 0-4 for grid positions
    order: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActualOfferCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    description_html: Optional[str] = None
    image_url: str
    banner_image_url: Optional[str] = None
    link_url: str
    product_ids: List[str] = []
    background_color: Optional[str] = "#ffffff"
    text_color: Optional[str] = "#000000"
    position: int = 0

class Promotion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    detailed_description: Optional[str] = None  # Большое детальное описание для страницы
    image_url: str
    discount_text: Optional[str] = None  # "-50%" или "2+1"
    link_url: Optional[str] = None  # Ссылка на товары акции
    countdown_enabled: bool = False
    countdown_end_date: Optional[datetime] = None
    background_color: Optional[str] = "#ffffff"
    text_color: Optional[str] = "#000000"
    badge_color: Optional[str] = "#ef4444"  # Цвет бейджа скидки
    order: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PromotionCreate(BaseModel):
    title: str
    description: str
    detailed_description: Optional[str] = None
    image_url: str
    discount_text: Optional[str] = None
    link_url: Optional[str] = None
    countdown_enabled: bool = False
    countdown_end_date: Optional[datetime] = None
    background_color: Optional[str] = "#ffffff"
    text_color: Optional[str] = "#000000"
    badge_color: Optional[str] = "#ef4444"
    order: int = 0
    active: bool = True

class PromotionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    detailed_description: Optional[str] = None
    image_url: Optional[str] = None
    discount_text: Optional[str] = None
    link_url: Optional[str] = None
    countdown_enabled: Optional[bool] = None
    countdown_end_date: Optional[datetime] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    badge_color: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None

    order: int = 0
    active: bool = True

class ActualOfferUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    description_html: Optional[str] = None
    image_url: Optional[str] = None
    banner_image_url: Optional[str] = None
    link_url: Optional[str] = None
    product_ids: Optional[List[str]] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    position: Optional[int] = None
    order: Optional[int] = None
    active: Optional[bool] = None

    active: Optional[bool] = None

    notes: Optional[str] = None
    assigned_to: Optional[str] = None



# Универсальная модель для кастомных разделов (Хиты продаж, Новинки, Популярные, etc.)
class CustomSection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str  # "Хіти продажу", "Новинки", "Популярні" и т.д.
    slug: str  # "bestsellers", "new", "popular", etc. (для URL)
    description: Optional[str] = None  # Описание раздела
    description_html: Optional[str] = None  # HTML описание для детальной страницы
    banner_image_url: Optional[str] = None  # Баннер для страницы раздела
    icon: Optional[str] = None  # Иконка для главной страницы (emoji или класс)
    product_ids: List[str] = []  # ID товаров в этом разделе
    display_on_home: bool = True  # Показывать на главной странице
    order: int = 0  # Порядок сортировки на главной
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomSectionCreate(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    description_html: Optional[str] = None
    banner_image_url: Optional[str] = None
    icon: Optional[str] = None
    product_ids: List[str] = []
    display_on_home: bool = True
    order: int = 0
    active: bool = True

class CustomSectionUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    description_html: Optional[str] = None
    banner_image_url: Optional[str] = None
    icon: Optional[str] = None
    product_ids: Optional[List[str]] = None
    display_on_home: Optional[bool] = None
    order: Optional[int] = None
    active: Optional[bool] = None

# ============= CRM MODELS =============

class CustomerNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    author_id: str
    author_name: str
    note: str
    type: str = "general"  # general, call, email, meeting, complaint
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerNoteCreate(BaseModel):
    customer_id: str
    note: str
    type: str = "general"

class CustomerSegment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    conditions: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CRMTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    customer_id: Optional[str] = None
    assigned_to: str
    due_date: Optional[datetime] = None
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "pending"  # pending, in_progress, completed, cancelled
    type: str = "follow_up"  # follow_up, call, email, meeting
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class CRMTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    customer_id: Optional[str] = None
    assigned_to: str
    due_date: Optional[datetime] = None
    priority: str = "medium"
    type: str = "follow_up"

class CRMTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    source: str = "website"  # website, referral, social, ads, other
    status: str = "new"  # new, contacted, qualified, converted, lost
    interest: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    converted_to_customer_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    source: str = "website"
    interest: Optional[str] = None
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None

class EmailTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject: str
    body: str
    type: str = "marketing"  # marketing, transactional, notification
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============= AUTH UTILITIES =============

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_doc)

async def get_current_seller(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["seller", "admin"]:
        raise HTTPException(status_code=403, detail="Seller privileges required")
    return current_user

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        company_name=user_data.company_name
    )
    
    user_doc = user.model_dump()
    user_doc["password_hash"] = get_password_hash(user_data.password)
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    
    await db.users.insert_one(user_doc)
    access_token = create_access_token({"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_doc.pop("password_hash", None)
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    
    user = User(**user_doc)
    access_token = create_access_token({"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/users/me", response_model=User)
async def update_my_profile(
    update_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    # Remove fields that shouldn't be updated this way
    update_data.pop("password", None)
    update_data.pop("password_hash", None)
    update_data.pop("role", None)
    update_data.pop("id", None)
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    updated_user.pop("password_hash", None)
    
    return User(**updated_user)

@api_router.post("/users/change-password")
async def change_password(
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Требуются текущий и новый пароль")
    
    # Verify current password
    user_doc = await db.users.find_one({"id": current_user.id})
    if not verify_password(current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Неверный текущий пароль")
    
    # Hash and save new password
    new_password_hash = get_password_hash(new_password)
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    return {"message": "Пароль успешно изменен"}

@api_router.post("/users/change-email")
async def change_email(
    data: dict,
    current_user: User = Depends(get_current_user)
):
    """Change user email"""
    new_email = data.get("new_email")
    current_password = data.get("current_password")
    
    if not new_email or not current_password:
        raise HTTPException(status_code=400, detail="Требуются новый email и текущий пароль")
    
    # Verify current password
    user_doc = await db.users.find_one({"id": current_user.id})
    if not verify_password(current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Неверный пароль")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": new_email})
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")
    
    # Update email
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"email": new_email}}
    )
    
    return {"message": "Email успешно изменен"}

# ============= CATEGORIES ENDPOINTS =============

@api_router.get("/categories")
async def get_categories(tree: bool = False):
    """
    Get all categories. If tree=true, returns nested structure.
    Otherwise returns flat list.
    """
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat.get("created_at"), str):
            cat["created_at"] = datetime.fromisoformat(cat["created_at"])
    
    if not tree:
        return categories
    
    # Build tree structure
    def build_tree(parent_id=None):
        result = []
        for cat in categories:
            if cat.get("parent_id") == parent_id:
                cat_copy = dict(cat)
                children = build_tree(cat["id"])
                if children:
                    cat_copy["children"] = children
                result.append(cat_copy)
        return result
    
    return build_tree(None)

@api_router.post("/categories", response_model=Category)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_admin)
):
    category = Category(**category_data.model_dump())
    cat_doc = category.model_dump()
    cat_doc["created_at"] = cat_doc["created_at"].isoformat()
    await db.categories.insert_one(cat_doc)
    return category

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a category (admin only)
    """
    update_data = category_data.model_dump(exclude_unset=True)
    
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Return updated category
    updated_category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return Category(**updated_category)

@api_router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Delete a category (admin only)
    """
    result = await db.categories.delete_one({"id": category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}

# ============= PRODUCTS ENDPOINTS =============

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    seller_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {"status": "published"}
    
    # Build filter query
    if category_id:
        query["category_id"] = category_id
    if seller_id:
        query["seller_id"] = seller_id
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    
    # Use MongoDB text search for better relevance
    if search:
        query["$text"] = {"$search": search}
        # Add text score for sorting by relevance
        projection = {"_id": 0, "score": {"$meta": "textScore"}}
        
        # Default sort by relevance when searching
        sort_field = [("score", {"$meta": "textScore"})]
        
        # Override sort if explicitly requested
        if sort_by == "popularity":
            sort_field = [("views_count", -1), ("rating", -1)]
        elif sort_by == "newest":
            sort_field = [("created_at", -1)]
        elif sort_by == "price_asc":
            sort_field = [("price", 1)]
        elif sort_by == "price_desc":
            sort_field = [("price", -1)]
        elif sort_by == "rating":
            sort_field = [("rating", -1), ("reviews_count", -1)]
        
        products = await db.products.find(query, projection).sort(sort_field).skip(skip).limit(limit).to_list(limit)
        
        # Remove score from response
        for prod in products:
            prod.pop("score", None)
    else:
        # No search query - use standard sorting
        sort_field = [("created_at", -1)]  # Default: newest first
        if sort_by == "popularity":
            sort_field = [("views_count", -1), ("rating", -1)]
        elif sort_by == "newest":
            sort_field = [("created_at", -1)]
        elif sort_by == "price_asc":
            sort_field = [("price", 1)]
        elif sort_by == "price_desc":
            sort_field = [("price", -1)]
        elif sort_by == "rating":
            sort_field = [("rating", -1), ("reviews_count", -1)]
        
        products = await db.products.find(query, {"_id": 0}).sort(sort_field).skip(skip).limit(limit).to_list(limit)
    for prod in products:
        if isinstance(prod.get("created_at"), str):
            prod["created_at"] = datetime.fromisoformat(prod["created_at"])
        if isinstance(prod.get("updated_at"), str):
            prod["updated_at"] = datetime.fromisoformat(prod["updated_at"])
    return products

@api_router.get("/products/search/suggestions")
async def search_suggestions(q: str, limit: int = 5):
    """
    Get search suggestions based on product titles
    Fast autocomplete endpoint
    """
    if not q or len(q) < 2:
        return []
    
    # Use regex search for better compatibility
    query = {
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"short_description": {"$regex": q, "$options": "i"}}
        ],
        "status": "published"
    }
    
    # Get products sorted by title match first
    products = await db.products.find(
        query,
        {"_id": 0, "title": 1, "id": 1, "price": 1, "images": 1}
    ).limit(limit).to_list(limit)
    
    return [
        {
            "title": p["title"],
            "id": p["id"],
            "price": p.get("price"),
            "image": p["images"][0] if p.get("images") else None
        }
        for p in products
    ]

@api_router.get("/products/search/stats")
async def search_stats(search: str):
    """
    Get search statistics - total results, price range, available categories
    """
    if not search:
        return {"total": 0, "price_range": {}, "categories": []}
    
    query = {
        "$text": {"$search": search},
        "status": "published"
    }
    
    # Get total count
    total = await db.products.count_documents(query)
    
    # Get price range
    price_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "min_price": {"$min": "$price"},
            "max_price": {"$max": "$price"},
            "avg_price": {"$avg": "$price"}
        }}
    ]
    price_result = await db.products.aggregate(price_pipeline).to_list(1)
    
    # Get categories distribution
    category_pipeline = [
        {"$match": query},
        {"$group": {"_id": "$category_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    category_results = await db.products.aggregate(category_pipeline).to_list(10)
    
    # Enrich with category names
    categories = []
    for cat in category_results:
        if cat["_id"]:
            category = await db.categories.find_one({"id": cat["_id"]}, {"_id": 0, "name": 1})
            if category:
                categories.append({
                    "id": cat["_id"],
                    "name": category["name"],
                    "count": cat["count"]
                })
    
    return {
        "total": total,
        "price_range": price_result[0] if price_result else {},
        "categories": categories
    }


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get("created_at"), str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])
    if isinstance(product.get("updated_at"), str):
        product["updated_at"] = datetime.fromisoformat(product["updated_at"])
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_seller)
):
    # Auto-generate slug from title if not provided
    product_dict = product_data.model_dump()
    if not product_dict.get("slug"):
        import re
        slug_base = re.sub(r'[^a-z0-9]+', '-', product_dict["title"].lower()).strip('-')
        product_dict["slug"] = f"{slug_base}-{str(uuid.uuid4())[:8]}"
    
    product = Product(
        seller_id=current_user.id,
        **product_dict
    )
    
    prod_doc = product.model_dump()
    prod_doc["created_at"] = prod_doc["created_at"].isoformat()
    prod_doc["updated_at"] = prod_doc["updated_at"].isoformat()
    
    await db.products.insert_one(prod_doc)
    return product

@api_router.patch("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    update_data: ProductUpdate,
    current_user: User = Depends(get_current_seller)
):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["seller_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump(exclude_unset=True).items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.update_one({"id": product_id}, {"$set": update_dict})
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated_product.get("created_at"), str):
        updated_product["created_at"] = datetime.fromisoformat(updated_product["created_at"])
    if isinstance(updated_product.get("updated_at"), str):
        updated_product["updated_at"] = datetime.fromisoformat(updated_product["updated_at"])
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_seller)
):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["seller_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted successfully"}

# ============= REVIEWS ENDPOINTS =============

@api_router.get("/products/{product_id}/reviews", response_model=List[Review])
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(1000)
    for review in reviews:
        if isinstance(review.get("created_at"), str):
            review["created_at"] = datetime.fromisoformat(review["created_at"])
    return reviews

@api_router.post("/reviews", response_model=Review)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if user purchased this product
    user_orders = await db.orders.find({
        "buyer_id": current_user.id,
        "payment_status": {"$in": ["completed", "paid"]}
    }, {"_id": 0}).to_list(1000)
    
    has_purchased = False
    for order in user_orders:
        for item in order.get("items", []):
            if item.get("product_id") == review_data.product_id:
                has_purchased = True
                break
        if has_purchased:
            break
    
    if not has_purchased:
        raise HTTPException(
            status_code=403, 
            detail="You can only review products you have purchased"
        )
    
    # Check if user already reviewed this product
    existing = await db.reviews.find_one({
        "product_id": review_data.product_id,
        "user_id": current_user.id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this product")
    
    review = Review(
        product_id=review_data.product_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        rating=review_data.rating,
        comment=review_data.comment
    )
    
    review_doc = review.model_dump()
    review_doc["created_at"] = review_doc["created_at"].isoformat()
    await db.reviews.insert_one(review_doc)
    
    # Update product rating
    all_reviews = await db.reviews.find({"product_id": review_data.product_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.products.update_one(
        {"id": review_data.product_id},
        {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(all_reviews)}}
    )
    
    return review

# ============= CART ENDPOINTS =============

@api_router.get("/cart", response_model=Cart)
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    if not cart:
        cart = Cart(user_id=current_user.id)
        cart_doc = cart.model_dump()
        cart_doc["created_at"] = cart_doc["created_at"].isoformat()
        cart_doc["updated_at"] = cart_doc["updated_at"].isoformat()
        await db.carts.insert_one(cart_doc)
        return cart
    
    if isinstance(cart.get("created_at"), str):
        cart["created_at"] = datetime.fromisoformat(cart["created_at"])
    if isinstance(cart.get("updated_at"), str):
        cart["updated_at"] = datetime.fromisoformat(cart["updated_at"])
    return Cart(**cart)

@api_router.post("/cart/items")
async def add_to_cart(
    item: AddToCartRequest,
    current_user: User = Depends(get_current_user)
):
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["stock_level"] < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    if not cart:
        cart = Cart(user_id=current_user.id).model_dump()
        cart["created_at"] = cart["created_at"].isoformat()
        cart["updated_at"] = cart["updated_at"].isoformat()
    
    cart_item = CartItem(
        product_id=item.product_id,
        quantity=item.quantity,
        price=product["price"]
    )
    
    items = cart.get("items", [])
    existing_idx = next((i for i, x in enumerate(items) if x["product_id"] == item.product_id), None)
    
    if existing_idx is not None:
        items[existing_idx]["quantity"] += item.quantity
    else:
        items.append(cart_item.model_dump())
    
    cart["items"] = items
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": cart},
        upsert=True
    )
    
    return {"message": "Item added to cart", "cart": cart}

@api_router.delete("/cart/items/{product_id}")
async def remove_from_cart(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = [item for item in cart.get("items", []) if item["product_id"] != product_id]
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(current_user: User = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Cart cleared"}

# ============= CHECKOUT & ORDERS =============

@api_router.post("/checkout/create-session")
async def create_checkout_session(
    request: Request,
    checkout_data: CheckoutRequest,
    current_user: User = Depends(get_current_user)
):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    total = sum(item["price"] * item["quantity"] for item in cart["items"])
    
    order_items = []
    for item in cart["items"]:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            order_items.append(OrderItem(
                product_id=item["product_id"],
                title=product["title"],
                quantity=item["quantity"],
                price=item["price"],
                seller_id=product["seller_id"]
            ))
    
    order = Order(
        order_number=f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
        buyer_id=current_user.id,
        items=order_items,
        total_amount=total,
        shipping_address=checkout_data.shipping_address,
        status="pending",
        payment_status="pending"
    )
    
    order_doc = order.model_dump()
    order_doc["created_at"] = order_doc["created_at"].isoformat()
    order_doc["updated_at"] = order_doc["updated_at"].isoformat()
    await db.orders.insert_one(order_doc)
    
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    success_url = f"{request.headers.get('origin', host_url)}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.headers.get('origin', host_url)}/checkout/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=total,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order.id,
            "user_id": current_user.id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    payment = PaymentTransaction(
        order_id=order.id,
        session_id=session.session_id,
        amount=total,
        currency="usd",
        payment_status="pending",
        user_id=current_user.id,
        metadata={"order_number": order.order_number}
    )
    
    payment_doc = payment.model_dump()
    payment_doc["created_at"] = payment_doc["created_at"].isoformat()
    payment_doc["updated_at"] = payment_doc["updated_at"].isoformat()
    await db.payment_transactions.insert_one(payment_doc)
    
    await db.orders.update_one(
        {"id": order.id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {
        "checkout_url": session.url,
        "session_id": session.session_id,
        "order_id": order.id
    }

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    if status.payment_status == "paid":
        payment = await db.payment_transactions.find_one({"session_id": session_id})
        if payment and payment.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            await db.orders.update_one(
                {"id": payment["order_id"]},
                {"$set": {
                    "payment_status": "paid",
                    "status": "processing",
                    "payment_method": "stripe",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            order = await db.orders.find_one({"id": payment["order_id"]})
            if order:
                await db.carts.update_one(
                    {"user_id": order["buyer_id"]},
                    {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
    
    return status

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = str(request.base_url).rstrip('/') + "/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        logger.info(f"Stripe webhook: {webhook_response.event_type}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Stripe webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# ============= ORDERS ENDPOINTS =============

@api_router.post("/orders", response_model=Order)
async def create_order(
    order_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new order"""
    try:
        # Create order object
        order = Order(
            order_number=order_data.get("order_number", f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"),
            buyer_id=order_data.get("buyer_id", current_user.id),
            items=order_data.get("items", []),
            total_amount=order_data.get("total_amount", 0),
            currency=order_data.get("currency", "USD"),
            shipping_address=order_data.get("shipping_address", {}),
            status=order_data.get("status", "pending"),
            payment_status=order_data.get("payment_status", "pending"),
            payment_method=order_data.get("payment_method", "cash_on_delivery")
        )
        
        # Save to database
        order_doc = order.model_dump()
        order_doc["created_at"] = order_doc["created_at"].isoformat()
        order_doc["updated_at"] = order_doc["updated_at"].isoformat()
        await db.orders.insert_one(order_doc)
        
        # Clear cart after successful order creation
        await db.carts.update_one(
            {"user_id": current_user.id},
            {"$set": {"items": []}}
        )
        
        # Send email notifications
        try:
            # Get customer info
            customer = await db.users.find_one({"id": current_user.id}, {"_id": 0})
            customer_name = customer.get("full_name", "Покупатель") if customer else "Покупатель"
            customer_email = customer.get("email", "") if customer else ""
            
            # Enrich order data for emails
            email_order_data = {
                "order_number": order.order_number,
                "buyer_id": order.buyer_id,
                "customer_name": customer_name,
                "customer_email": customer_email,
                "items": [],
                "total_amount": order.total_amount,
                "status": order.status,
                "payment_method": order.payment_method
            }
            
            # Enrich items with product names
            for item in order.items:
                product = await db.products.find_one({"id": item.get("product_id")}, {"_id": 0})
                email_order_data["items"].append({
                    "product_name": product.get("title", "Unknown") if product else "Unknown",
                    "quantity": item.get("quantity", 0),
                    "price": item.get("price", 0)
                })
            
            # Send confirmation to customer
            if customer_email:
                email_service.send_order_confirmation(customer_email, email_order_data)
            
            # Send notification to admin
            email_service.send_admin_notification(email_order_data)
            
        except Exception as e:
            logger.error(f"Failed to send email notifications: {str(e)}")
            # Don't fail the order creation if email fails
        
        return order
        
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    query = {"buyer_id": current_user.id}
    if current_user.role == "admin":
        query = {}
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order.get("created_at"), str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if isinstance(order.get("updated_at"), str):
            order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    return orders

@api_router.get("/admin/orders")
async def get_admin_orders(current_user: User = Depends(get_current_admin)):
    """
    Get all orders with detailed information for admin analytics
    """
    try:
        # Get all orders
        orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
        
        # Enrich with customer information
        for order in orders:
            # Get customer info
            customer = await db.users.find_one({"id": order.get("buyer_id")}, {"_id": 0})
            if customer:
                order["customer_name"] = customer.get("full_name", "N/A")
                order["customer_email"] = customer.get("email", "N/A")
            else:
                order["customer_name"] = "Unknown"
                order["customer_email"] = "N/A"
            
            # Enrich items with product details
            for item in order.get("items", []):
                product = await db.products.find_one({"id": item.get("product_id")}, {"_id": 0})
                if product:
                    item["product_name"] = product.get("title", "Unknown Product")
                    item["category_name"] = product.get("category_name")
                    item["price"] = item.get("price", product.get("price", 0))
            
            # Handle datetime serialization
            if isinstance(order.get("created_at"), str):
                order["created_at"] = order["created_at"]
            elif hasattr(order.get("created_at"), 'isoformat'):
                order["created_at"] = order["created_at"].isoformat()
                
            if isinstance(order.get("updated_at"), str):
                order["updated_at"] = order["updated_at"]
            elif hasattr(order.get("updated_at"), 'isoformat'):
                order["updated_at"] = order["updated_at"].isoformat()
        
        return orders
    except Exception as e:
        logger.error(f"Error fetching admin orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= ADMIN REVIEWS MANAGEMENT =============

@api_router.get("/admin/reviews", response_model=List[ReviewWithProduct])
async def get_all_reviews_admin(current_user: User = Depends(get_current_admin)):
    """
    Get all reviews with product and user information for admin management
    """
    try:
        reviews = await db.reviews.find({}, {"_id": 0}).to_list(10000)
        
        enriched_reviews = []
        for review in reviews:
            # Get product info
            product = await db.products.find_one({"id": review.get("product_id")}, {"_id": 0})
            product_name = product.get("title", "Unknown Product") if product else "Unknown Product"
            
            # Get user info
            user = await db.users.find_one({"id": review.get("user_id")}, {"_id": 0})
            user_email = user.get("email", "N/A") if user else "N/A"
            
            # Parse created_at
            created_at = review.get("created_at")
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            
            enriched_review = ReviewWithProduct(
                id=review["id"],
                product_id=review["product_id"],
                product_name=product_name,
                user_id=review["user_id"],
                user_name=review.get("user_name", "Unknown"),
                user_email=user_email,
                rating=review["rating"],
                comment=review["comment"],
                created_at=created_at
            )
            enriched_reviews.append(enriched_review)
        
        # Sort by created_at descending
        enriched_reviews.sort(key=lambda x: x.created_at, reverse=True)
        
        return enriched_reviews
    except Exception as e:
        logger.error(f"Error fetching admin reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/reviews/{review_id}")
async def delete_review_admin(
    review_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Delete a review (admin only)
    """
    result = await db.reviews.delete_one({"id": review_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return {"message": "Review deleted successfully"}



@api_router.put("/admin/reviews/{review_id}/feature")
async def toggle_review_featured(
    review_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Toggle review featured status (show on homepage)
    """
    review = await db.reviews.find_one({"id": review_id})
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    new_featured_status = not review.get("featured", False)
    
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"featured": new_featured_status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update review")
    
    return {
        "message": "Review featured status updated",
        "featured": new_featured_status
    }


@api_router.get("/reviews/featured", response_model=List[ReviewWithProduct])
async def get_featured_reviews():
    """
    Get featured reviews for homepage (public endpoint)
    """
    try:
        reviews = await db.reviews.find(
            {"featured": True},
            {"_id": 0}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        enriched_reviews = []
        for review in reviews:
            # Get product info
            product = await db.products.find_one({"id": review.get("product_id")}, {"_id": 0})
            product_name = product.get("title", "Unknown Product") if product else "Unknown Product"
            
            # Get user info
            user = await db.users.find_one({"id": review.get("user_id")}, {"_id": 0})
            user_email = user.get("email", "N/A") if user else "N/A"
            
            # Parse created_at
            created_at = review.get("created_at")
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            
            enriched_review = ReviewWithProduct(
                id=review["id"],
                product_id=review["product_id"],
                product_name=product_name,
                user_id=review["user_id"],
                user_name=review.get("user_name", "Unknown"),
                user_email=user_email,
                rating=review["rating"],
                comment=review["comment"],
                created_at=created_at
            )
            enriched_reviews.append(enriched_review)
        
        return enriched_reviews
    except Exception as e:
        logger.error(f"Error fetching featured reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/products/{product_id}/can-review")
async def can_user_review_product(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Check if user can review a product (purchased and not reviewed yet)
    """
    # Check if user purchased this product
    user_orders = await db.orders.find({
        "buyer_id": current_user.id,
        "payment_status": {"$in": ["completed", "paid"]}
    }, {"_id": 0}).to_list(1000)
    
    has_purchased = False
    for order in user_orders:
        for item in order.get("items", []):
            if item.get("product_id") == product_id:
                has_purchased = True
                break
        if has_purchased:
            break
    
    # Check if already reviewed
    existing_review = await db.reviews.find_one({
        "product_id": product_id,
        "user_id": current_user.id
    })
    
    return {
        "can_review": has_purchased and not existing_review,
        "has_purchased": has_purchased,
        "already_reviewed": existing_review is not None
    }

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["buyer_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order.get("updated_at"), str):
        order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    return Order(**order)

# ============= SELLER DASHBOARD =============

@api_router.get("/seller/products", response_model=List[Product])
async def get_seller_products(current_user: User = Depends(get_current_seller)):
    products = await db.products.find({"seller_id": current_user.id}, {"_id": 0}).to_list(1000)
    for prod in products:
        if isinstance(prod.get("created_at"), str):
            prod["created_at"] = datetime.fromisoformat(prod["created_at"])
        if isinstance(prod.get("updated_at"), str):
            prod["updated_at"] = datetime.fromisoformat(prod["updated_at"])
    return products

@api_router.get("/seller/orders", response_model=List[Order])
async def get_seller_orders(current_user: User = Depends(get_current_seller)):
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    seller_orders = []
    
    for order in orders:
        if any(item["seller_id"] == current_user.id for item in order.get("items", [])):
            if isinstance(order.get("created_at"), str):
                order["created_at"] = datetime.fromisoformat(order["created_at"])
            if isinstance(order.get("updated_at"), str):
                order["updated_at"] = datetime.fromisoformat(order["updated_at"])
            seller_orders.append(order)
    
    return seller_orders

@api_router.get("/seller/stats")
async def get_seller_stats(current_user: User = Depends(get_current_seller)):
    products = await db.products.find({"seller_id": current_user.id}).to_list(1000)
    orders = await db.orders.find({}).to_list(1000)
    
    total_products = len(products)
    total_revenue = 0.0
    total_orders = 0
    
    for order in orders:
        if order.get("payment_status") == "paid":
            for item in order.get("items", []):
                if item["seller_id"] == current_user.id:
                    total_revenue += item["price"] * item["quantity"]
                    total_orders += 1
    
    return {
        "total_products": total_products,
        "total_revenue": total_revenue,
        "total_orders": total_orders
    }

# ============= AI ENDPOINTS =============

@api_router.post("/ai/generate-description", response_model=AIDescriptionResponse)
async def generate_product_description(
    request: AIDescriptionRequest,
    current_user: User = Depends(get_current_seller)
):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    chat = LlmChat(
        api_key=api_key,
        session_id=f"product-desc-{str(uuid.uuid4())}",
        system_message="You are a professional product description writer for an e-commerce marketplace. Create engaging, SEO-friendly product descriptions."
    )
    
    chat.with_model("openai", "gpt-4o")
    
    features_text = "\n".join(request.key_features) if request.key_features else "No specific features provided"
    
    prompt = f"""Create a product description for:

Product Title: {request.product_title}
Category: {request.category}
Key Features:
{features_text}

Provide:
1. A detailed product description (2-3 paragraphs, 150-200 words)
2. A short description (1 sentence, max 160 characters)

Format your response as JSON with keys: "description" and "short_description"""
    
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    
    try:
        import json
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        return AIDescriptionResponse(
            description=result.get("description", response),
            short_description=result.get("short_description", request.product_title)
        )
    except:
        lines = response.split("\n\n")
        return AIDescriptionResponse(
            description=response if len(lines) < 2 else "\n\n".join(lines[:-1]),
            short_description=lines[-1] if len(lines) > 1 else request.product_title[:160]
        )

# ============= ADDITIONAL AI ENDPOINTS (SECURE PROXY) =============

class AIRecommendationsRequest(BaseModel):
    product_name: str
    category: str
    price: float
    available_products: List[Dict[str, Any]]

class AIRecommendationsResponse(BaseModel):
    success: bool
    recommendations: List[Dict[str, Any]] = []
    error: Optional[str] = None

@api_router.post("/ai/recommendations", response_model=AIRecommendationsResponse)
async def generate_ai_recommendations(request: AIRecommendationsRequest):
    """
    Generate AI product recommendations (SECURE - Backend only)
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recommendations-{str(uuid.uuid4())}",
            system_message="You are an AI assistant for e-commerce, specializing in personalized product recommendations. Analyze products and suggest the most relevant options."
        )
        
        chat.with_model("openai", "gpt-4o")
        
        products_context = "\n".join([
            f"ID: {p.get('id')}, Title: {p.get('title')}, Category: {p.get('category', 'N/A')}, Price: ${p.get('price', 0)}"
            for p in request.available_products[:20]
        ])
        
        prompt = f"""User is viewing product:
Title: {request.product_name}
Category: {request.category}
Price: ${request.price}

Available products for recommendation:
{products_context}

Task: Select 3-5 most suitable products for recommendation and explain why.

Respond in JSON format:
{{
  "recommendations": [
    {{
      "productId": "product id",
      "reason": "short reason (1 sentence)"
    }}
  ]
}}"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        import json
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        
        return AIRecommendationsResponse(
            success=True,
            recommendations=result.get("recommendations", [])
        )
    except Exception as e:
        logger.error(f"Error in AI recommendations: {str(e)}")
        return AIRecommendationsResponse(
            success=False,
            recommendations=[],
            error=str(e)
        )

class AIChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    context: Optional[Dict[str, Any]] = {}

class AIChatResponse(BaseModel):
    success: bool
    message: str
    error: Optional[str] = None

@api_router.post("/ai/chat", response_model=AIChatResponse)
async def ai_chatbot(request: AIChatRequest):
    """
    AI Chatbot for customer support (SECURE - Backend only)
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        
        system_context = f"""You are a friendly AI assistant for a Ukrainian marketplace.

Your capabilities:
- Help with product selection
- Answer questions about delivery, payment, returns
- Product recommendations based on preferences
- Help with order placement

Rules:
- Respond in Russian
- Be polite and professional
- If you don't know the answer, admit it honestly
- Recommend contacting support for complex questions
- Use emojis for friendliness

{f"Cart items: {request.context.get('cartItems')}" if request.context.get('cartItems') else ''}
{f"User name: {request.context.get('userName')}" if request.context.get('userName') else ''}"""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"chat-{str(uuid.uuid4())}",
            system_message=system_context
        )
        
        chat.with_model("openai", "gpt-4o")
        
        last_user_message = None
        for msg in request.messages:
            if msg.get('role') == 'user':
                last_user_message = msg.get('content', '')
        
        if not last_user_message:
            return AIChatResponse(
                success=False,
                message="No user message provided",
                error="Invalid request"
            )
        
        user_message = UserMessage(text=last_user_message)
        response = await chat.send_message(user_message)
        
        return AIChatResponse(
            success=True,
            message=response
        )
    except Exception as e:
        logger.error(f"Error in AI chat: {str(e)}")
        return AIChatResponse(
            success=False,
            message="Извините, произошла ошибка. Попробуйте позже или свяжитесь с поддержкой.",
            error=str(e)
        )

class AISEORequest(BaseModel):
    product_name: str
    category: str
    features: List[str] = []

class AISEOResponse(BaseModel):
    success: bool
    title: Optional[str] = None
    metaDescription: Optional[str] = None
    keywords: Optional[List[str]] = []
    error: Optional[str] = None

@api_router.post("/ai/seo", response_model=AISEOResponse)
async def generate_seo(
    request: AISEORequest,
    current_user: User = Depends(get_current_seller)
):
    """
    Generate SEO-optimized title and meta description (SECURE - Backend only)
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"seo-{str(uuid.uuid4())}",
            system_message="You are an SEO specialist. Create optimized titles and descriptions for products."
        )
        
        chat.with_model("openai", "gpt-4o")
        
        features_text = ", ".join(request.features) if request.features else "No specific features"
        
        prompt = f"""Create SEO-optimized texts for product:

Product Name: {request.product_name}
Category: {request.category}
Features: {features_text}

Respond in JSON format:
{{
  "title": "SEO title (up to 60 characters)",
  "metaDescription": "Meta description (up to 160 characters)",
  "keywords": ["keyword1", "keyword2"]
}}"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        import json
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        
        return AISEOResponse(
            success=True,
            title=result.get("title"),
            metaDescription=result.get("metaDescription"),
            keywords=result.get("keywords", [])
        )
    except Exception as e:
        logger.error(f"Error in SEO generation: {str(e)}")
        return AISEOResponse(
            success=False,
            error=str(e)
        )

# ============= ADVANCED ANALYTICS ENDPOINTS =============

@api_router.get("/admin/analytics/advanced/visits")
async def get_site_visits_analytics(
    days: int = 30,
    current_user: User = Depends(get_current_admin)
):
    """Get site visit statistics"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_site_visits(days)

@api_router.get("/admin/analytics/advanced/abandoned-carts")
async def get_abandoned_carts_analytics(current_user: User = Depends(get_current_admin)):
    """Get abandoned cart statistics"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_abandoned_carts()

@api_router.get("/admin/analytics/advanced/wishlist")
async def get_wishlist_analytics(current_user: User = Depends(get_current_admin)):
    """Get wishlist analytics"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_wishlist_analytics()

@api_router.get("/admin/analytics/advanced/conversion-funnel")
async def get_conversion_funnel(current_user: User = Depends(get_current_admin)):
    """Get conversion funnel data"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_conversion_funnel()

@api_router.get("/admin/analytics/advanced/product-performance")
async def get_product_performance(
    days: int = 30,
    current_user: User = Depends(get_current_admin)
):
    """Get product performance metrics"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_product_performance(days)

@api_router.get("/admin/analytics/advanced/time-based")
async def get_time_based_analytics(
    months: int = 12,
    current_user: User = Depends(get_current_admin)
):
    """Get time-based analytics"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_time_based_analytics(months)

@api_router.get("/admin/analytics/advanced/customer-ltv")
async def get_customer_ltv(current_user: User = Depends(get_current_admin)):
    """Get customer lifetime value"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_customer_lifetime_value()

@api_router.get("/admin/analytics/advanced/category-performance")
async def get_category_performance(current_user: User = Depends(get_current_admin)):
    """Get category performance"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_category_performance()

@api_router.get("/admin/analytics/advanced/time-on-pages")
async def get_time_on_pages(current_user: User = Depends(get_current_admin)):
    """Get average time spent on different pages"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_time_on_pages()

@api_router.get("/admin/analytics/advanced/product-page-analytics")
async def get_product_page_analytics(current_user: User = Depends(get_current_admin)):
    """Get detailed analytics for product pages (time + conversion)"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_product_page_analytics()

@api_router.get("/admin/analytics/advanced/user-behavior-flow")
async def get_user_behavior_flow(current_user: User = Depends(get_current_admin)):
    """Get user behavior flow (page transitions)"""
    analytics = get_advanced_analytics_service(db)
    return await analytics.get_user_behavior_flow()


# ============= ANALYTICS EVENT TRACKING =============

class AnalyticsEvent(BaseModel):
    session_id: str
    user_id: str
    event_type: str
    timestamp: str
    page_path: Optional[str] = None
    page_title: Optional[str] = None
    time_spent: Optional[int] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    query: Optional[str] = None
    results_count: Optional[int] = None
    # Session tracking fields
    session_duration: Optional[int] = None
    pages_viewed: Optional[int] = None
    pages_list: Optional[List[Dict[str, Any]]] = None
    total_time: Optional[int] = None
    pages_viewed_count: Optional[int] = None
    current_page: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

@api_router.post("/analytics/event")
async def track_analytics_event(event: AnalyticsEvent):
    """
    Track user analytics event (page views, time spent, interactions)
    """
    try:
        event_doc = event.model_dump()
        event_doc["created_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.analytics_events.insert_one(event_doc)
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Error tracking analytics event: {str(e)}")
        return {"success": False, "error": str(e)}

# ============= CONTACT & SUPPORT =============

@api_router.post("/contact/callback")
async def request_callback(request: ContactRequest):
    callback_doc = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "phone": request.phone,
        "message": request.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    }
    await db.callbacks.insert_one(callback_doc)
    return {"message": "Callback request received. We will contact you soon."}

# ============= ADMIN ENDPOINTS =============

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_current_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get("created_at"), str):
            user["created_at"] = datetime.fromisoformat(user["created_at"])
    return users

from analytics_service import init_analytics
from advanced_analytics_service import get_advanced_analytics_service

# Initialize analytics service
analytics_svc = init_analytics(db)

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_admin)):
    return await analytics_svc.get_overview_stats()

@api_router.get("/admin/analytics/revenue")
async def get_revenue_analytics(days: int = 30, current_user: User = Depends(get_current_admin)):
    return await analytics_svc.get_revenue_by_period(days)

@api_router.get("/admin/analytics/top-products")
async def get_top_products(limit: int = 10, current_user: User = Depends(get_current_admin)):
    return await analytics_svc.get_top_products(limit)

@api_router.get("/admin/analytics/categories")
async def get_category_distribution(current_user: User = Depends(get_current_admin)):
    return await analytics_svc.get_category_distribution()

@api_router.get("/admin/analytics/user-growth")
async def get_user_growth(days: int = 30, current_user: User = Depends(get_current_admin)):
    return await analytics_svc.get_user_growth(days)

@api_router.get("/admin/analytics/sellers")
async def get_seller_performance(limit: int = 10, current_user: User = Depends(get_current_admin)):
    return await analytics_svc.get_seller_performance(limit)

@api_router.get("/admin/analytics/order-status")
async def get_order_status_distribution(current_user: User = Depends(get_current_admin)):
    return await analytics_svc.get_order_status_distribution()

# ============= AI FEATURES =============

from ai_service import ai_service
from email_service import email_service

class AIGenerateDescriptionRequest(BaseModel):
    product_name: str
    category: str
    price: Optional[float] = None
    features: Optional[List[str]] = None

@api_router.post("/ai/generate-description")
async def generate_product_description(
    request: AIGenerateDescriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI product description
    Requires seller or admin role
    """
    if current_user.role not in ['seller', 'admin']:
        raise HTTPException(status_code=403, detail="Only sellers and admins can generate descriptions")
    
    try:
        existing_info = {}
        if request.price:
            existing_info['price'] = request.price
        if request.features:
            existing_info['features'] = request.features
        
        result = await ai_service.generate_product_description(
            product_name=request.product_name,
            category=request.category,
            existing_info=existing_info if existing_info else None
        )
        
        return result
    except Exception as e:
        logger.error(f"Error in generate_product_description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= PAYOUTS =============

from payouts_service import init_payouts

# Initialize payouts service
payouts_svc = init_payouts(db)

class PayoutRequest(BaseModel):
    amount: float
    payment_method: str  # bank_transfer, paypal, stripe
    payment_details: Dict[str, str]  # account_number, email, etc.

@api_router.get("/seller/balance")
async def get_seller_balance(current_user: User = Depends(get_current_user)):
    if current_user.role != 'seller':
        raise HTTPException(status_code=403, detail="Only sellers can access balance")
    return await payouts_svc.calculate_seller_balance(current_user.id)

@api_router.post("/seller/payouts")
async def request_payout(
    request: PayoutRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'seller':
        raise HTTPException(status_code=403, detail="Only sellers can request payouts")
    
    try:
        payout = await payouts_svc.create_payout_request(
            current_user.id,
            request.amount,
            request.payment_method,
            request.payment_details
        )
        return {"success": True, "payout": payout}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/seller/payouts")
async def get_my_payouts(current_user: User = Depends(get_current_user)):
    if current_user.role != 'seller':
        raise HTTPException(status_code=403, detail="Only sellers can access payouts")
    return await payouts_svc.get_seller_payouts(current_user.id)

@api_router.get("/admin/payouts/pending")
async def get_pending_payouts_admin(current_user: User = Depends(get_current_admin)):
    return await payouts_svc.get_pending_payouts()

@api_router.post("/admin/payouts/{payout_id}/process")
async def process_payout_admin(
    payout_id: str,
    status: str,
    current_user: User = Depends(get_current_admin)
):
    if status not in ['completed', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    try:
        payout = await payouts_svc.process_payout(payout_id, current_user.id, status)
        return {"success": True, "payout": payout}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    """
    Generate AI product description
    Requires seller or admin role
    """
    if current_user.role not in ['seller', 'admin']:
        raise HTTPException(status_code=403, detail="Only sellers and admins can generate descriptions")
    
    try:
        existing_info = {}
        if request.price:
            existing_info['price'] = request.price
        if request.features:
            existing_info['features'] = request.features
        
        result = await ai_service.generate_product_description(
            product_name=request.product_name,
            category=request.category,
            existing_info=existing_info if existing_info else None
        )
        
        return result
    except Exception as e:
        logger.error(f"Error in generate_product_description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ai/recommendations")
async def get_product_recommendations(
    product_id: Optional[str] = None,
    limit: int = 5
):
    """
    Get AI-powered product recommendations
    Based on user history and current product
    """
    try:
        # Get user history (for now, use empty list - can be enhanced later)
        user_history = []
        
        # TODO: Get from user session/cookies if available
        if False:  # Placeholder for future auth integration
            # Get user's order history
            orders = await db.orders.find(
                {"buyer_id": current_user.id},
                {"_id": 0}
            ).limit(20).to_list(20)
            
            # Extract products from orders
            for order in orders:
                for item in order.get('items', []):
                    user_history.append({
                        'title': item.get('title'),
                        'category': 'Electronics',  # Default category
                        'id': item.get('product_id')
                    })
        
        # Get current product if provided
        current_product = None
        if product_id:
            product = await db.products.find_one({"id": product_id}, {"_id": 0})
            if product:
                current_product = {
                    'id': product['id'],
                    'title': product['name'],
                    'category': product.get('category', 'General')
                }
        
        # Get available products
        available_products = await db.products.find(
            {"status": "published"},
            {"_id": 0, "id": 1, "name": 1, "category": 1, "price": 1}
        ).limit(50).to_list(50)
        
        # Format for AI
        available_for_ai = [
            {
                'id': p['id'],
                'title': p['name'],
                'category': p.get('category', 'General'),
                'price': p.get('price', 0)
            }
            for p in available_products
        ]
        
        result = await ai_service.generate_recommendations(
            user_history=user_history,
            current_product=current_product,
            available_products=available_for_ai,
            limit=limit
        )
        
        return result
    except Exception as e:
        logger.error(f"Error in get_product_recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= NOVA POSHTA INTEGRATION =============

from novaposhta_service import novaposhta_service

@api_router.get("/novaposhta/cities")
async def search_novaposhta_cities(query: str, limit: int = 10):
    """
    Search for cities in Nova Poshta system
    """
    try:
        result = novaposhta_service.search_cities(query, limit)
        return result
    except Exception as e:
        logger.error(f"Error searching cities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/novaposhta/warehouses")
async def get_novaposhta_warehouses(city_ref: str, number: Optional[str] = None):
    """
    Get Nova Poshta warehouses/branches by city and optional warehouse number
    """
    try:
        result = novaposhta_service.get_warehouses(city_ref, number)
        return result
    except Exception as e:
        logger.error(f"Error getting warehouses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ROZETKAPAY PAYMENT INTEGRATION =============

from rozetkapay_service import rozetkapay_service

class RozetkaPayCreatePaymentRequest(BaseModel):
    external_id: str
    amount: float
    currency: str = "UAH"
    customer: Dict[str, Any]
    description: str = "Оплата заказа"

class RozetkaPayPaymentResponse(BaseModel):
    success: bool
    payment_id: Optional[str] = None
    external_id: Optional[str] = None
    is_success: Optional[bool] = None
    action_required: bool = False
    action: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None

@api_router.post("/payment/rozetkapay/create", response_model=RozetkaPayPaymentResponse)
async def create_rozetkapay_payment(
    request: RozetkaPayCreatePaymentRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create payment using RozetkaPay Hosted Checkout
    """
    try:
        # Get callback and result URLs
        backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
        frontend_url = backend_url.replace(':8001', ':3000').replace('/api', '')
        
        callback_url = f"{backend_url}/api/payment/rozetkapay/webhook"
        result_url = f"{frontend_url}/checkout/success"
        
        # Create payment
        result = rozetkapay_service.create_payment(
            external_id=request.external_id,
            amount=request.amount,
            currency=request.currency,
            customer=request.customer,
            callback_url=callback_url,
            result_url=result_url,
            description=request.description
        )
        
        if result.get("success"):
            # Save payment transaction to database
            payment_doc = {
                "id": str(uuid.uuid4()),
                "order_id": request.external_id,
                "payment_id": result.get("payment_id"),
                "user_id": current_user.id,
                "amount": request.amount,
                "currency": request.currency,
                "status": result.get("status", "pending"),
                "payment_method": "rozetkapay",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "raw_response": result.get("raw_response")
            }
            await db.payment_transactions.insert_one(payment_doc)
            
            return RozetkaPayPaymentResponse(
                success=True,
                payment_id=result.get("payment_id"),
                external_id=result.get("external_id"),
                is_success=result.get("is_success"),
                action_required=result.get("action_required", False),
                action=result.get("action"),
                status=result.get("status"),
                message="Payment created successfully"
            )
        else:
            logger.error(f"Payment creation failed: {result.get('error')}")
            return RozetkaPayPaymentResponse(
                success=False,
                error=result.get("error"),
                message="Failed to create payment"
            )
    
    except Exception as e:
        logger.error(f"Error in create_rozetkapay_payment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create payment: {str(e)}"
        )

@api_router.post("/payment/rozetkapay/webhook")
async def rozetkapay_webhook(request: Request):
    """
    Handle payment webhooks from RozetkaPay
    """
    try:
        # Get raw body and signature
        body = await request.body()
        body_str = body.decode('utf-8')
        signature = request.headers.get('X-ROZETKAPAY-SIGNATURE', '')
        
        logger.info(f"Received webhook from RozetkaPay")
        
        # Verify signature
        if not rozetkapay_service.verify_webhook_signature(body_str, signature):
            logger.warning("Invalid webhook signature")
            raise HTTPException(status_code=403, detail="Invalid signature")
        
        # Parse payload
        import json
        payload = json.loads(body_str)
        
        # Extract payment details
        external_id = payload.get("external_id")
        payment_id = payload.get("id")
        is_success = payload.get("is_success")
        details = payload.get("details", {})
        status = details.get("status")
        
        logger.info(f"Webhook for order {external_id}: status={status}, success={is_success}")
        
        # Update order status
        if external_id:
            order = await db.orders.find_one({"order_number": external_id})
            if order:
                new_status = "paid" if is_success else "payment_failed"
                await db.orders.update_one(
                    {"order_number": external_id},
                    {
                        "$set": {
                            "payment_status": new_status,
                            "payment_session_id": payment_id,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                logger.info(f"Order {external_id} updated to status: {new_status}")
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"order_id": external_id},
            {
                "$set": {
                    "status": status,
                    "is_success": is_success,
                    "webhook_received": True,
                    "webhook_data": payload,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {"status": "processed", "order_id": external_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process webhook")

@api_router.get("/payment/rozetkapay/info/{payment_id}")
async def get_payment_info(
    payment_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get payment information from RozetkaPay
    """
    try:
        result = rozetkapay_service.get_payment_info(payment_id)
        return result
    except Exception as e:
        logger.error(f"Error getting payment info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= IMAGE UPLOAD =============

@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin)
):
    """
    Upload image for slides or other purposes (admin only)
    Accepts any image format and converts to JPEG for universal compatibility
    """
    try:
        from PIL import Image
        import io
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        content = await file.read()
        
        # Open image with Pillow
        image = Image.open(io.BytesIO(content))
        
        # Convert to RGB if necessary (for JPEG compatibility)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Create white background for transparency
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Generate unique filename (always use .jpg)
        unique_filename = f"{uuid.uuid4()}.jpg"
        
        # Save file to public uploads folder
        upload_dir = Path("/app/frontend/public/uploads/slides")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_dir / unique_filename
        
        # Save optimized JPEG
        image.save(file_path, 'JPEG', quality=85, optimize=True)
        
        # Return public URL
        public_url = f"/uploads/slides/{unique_filename}"
        
        return {
            "url": public_url,
            "filename": unique_filename,
            "original_filename": file.filename
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

# ============= HERO SLIDES MANAGEMENT =============

@api_router.get("/slides", response_model=List[HeroSlide])
async def get_active_slides():
    """
    Get all active hero slides for homepage (public endpoint)
    """
    slides = await db.hero_slides.find({"active": True}).sort("order", 1).to_list(100)
    return slides

@api_router.get("/admin/slides", response_model=List[HeroSlide])
async def get_all_slides(current_user: User = Depends(get_current_admin)):
    """
    Get all hero slides (admin only)
    """
    slides = await db.hero_slides.find({}).sort("order", 1).to_list(100)
    return slides

@api_router.post("/admin/slides", response_model=HeroSlide)
async def create_slide(
    slide: HeroSlideCreate,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new hero slide (admin only)
    """
    slide_dict = slide.model_dump()
    slide_dict["id"] = str(uuid.uuid4())
    slide_dict["created_at"] = datetime.now(timezone.utc)
    slide_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.hero_slides.insert_one(slide_dict)
    return HeroSlide(**slide_dict)

@api_router.put("/admin/slides/{slide_id}", response_model=HeroSlide)
async def update_slide(
    slide_id: str,
    slide_update: HeroSlideUpdate,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a hero slide (admin only)
    """
    existing_slide = await db.hero_slides.find_one({"id": slide_id})
    if not existing_slide:
        raise HTTPException(status_code=404, detail="Slide not found")
    
    update_data = slide_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.hero_slides.update_one(
        {"id": slide_id},
        {"$set": update_data}
    )
    
    updated_slide = await db.hero_slides.find_one({"id": slide_id})
    return HeroSlide(**updated_slide)

@api_router.delete("/admin/slides/{slide_id}")
async def delete_slide(
    slide_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Delete a hero slide (admin only)
    """
    result = await db.hero_slides.delete_one({"id": slide_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slide not found")
    
    return {"message": "Slide deleted successfully"}


# ============= CRM API =============

@api_router.get("/crm/customers")
async def get_crm_customers(
    segment: Optional[str] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Get all customers with CRM metrics
    """
    customers = await crm_service.get_all_customers_with_metrics()
    
    # Filter by segment if provided
    if segment:
        customers = [c for c in customers if c.get("segment") == segment]
    
    return customers

@api_router.get("/crm/customer/{customer_id}")
async def get_customer_profile(
    customer_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Get detailed customer profile
    """
    profile = await crm_service.get_customer_profile(customer_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Customer not found")
    return profile

@api_router.post("/crm/notes", response_model=CustomerNote)
async def create_customer_note(
    note: CustomerNoteCreate,
    current_user: User = Depends(get_current_admin)
):
    """
    Add note to customer
    """
    note_dict = note.model_dump()
    note_dict["id"] = str(uuid.uuid4())
    note_dict["author_id"] = current_user.id
    note_dict["author_name"] = current_user.full_name
    note_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.customer_notes.insert_one(note_dict)
    return CustomerNote(**note_dict)

@api_router.get("/crm/notes/{customer_id}")
async def get_customer_notes(
    customer_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Get all notes for a customer
    """
    notes = await db.customer_notes.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notes

@api_router.post("/crm/tasks", response_model=CRMTask)
async def create_task(
    task: CRMTaskCreate,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a CRM task
    """
    task_dict = task.model_dump()
    task_dict["id"] = str(uuid.uuid4())
    task_dict["created_at"] = datetime.now(timezone.utc)
    task_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.crm_tasks.insert_one(task_dict)
    return CRMTask(**task_dict)

@api_router.get("/crm/tasks")
async def get_tasks(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Get CRM tasks with optional filters
    """
    query = {}
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    
    tasks = await db.crm_tasks.find(query, {"_id": 0}).sort("due_date", 1).to_list(1000)
    return tasks

@api_router.put("/crm/tasks/{task_id}")
async def update_task(
    task_id: str,
    task_update: CRMTaskUpdate,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a CRM task
    """
    update_data = task_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    if update_data.get("status") == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc)
    
    result = await db.crm_tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated_task = await db.crm_tasks.find_one({"id": task_id})
    return updated_task

@api_router.get("/crm/dashboard")
async def get_crm_dashboard(
    current_user: User = Depends(get_current_admin)
):
    """
    Get CRM dashboard metrics
    """
    # Get sales funnel
    funnel = await crm_service.get_sales_pipeline()
    
    # Get customer segments
    segments = await crm_service.get_customer_segments_stats()
    
    # Get recent activity (30 days)
    activity = await crm_service.get_customer_activity(30)
    
    # Get pending tasks
    pending_tasks = await db.crm_tasks.count_documents({"status": "pending"})
    overdue_tasks = await db.crm_tasks.count_documents({
        "status": {"$in": ["pending", "in_progress"]},
        "due_date": {"$lt": datetime.now(timezone.utc)}
    })
    
    # Get recent customers (last 7 days)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_customers_week = await db.users.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    return {
        "sales_funnel": funnel,
        "customer_segments": segments,
        "customer_activity": activity,
        "pending_tasks": pending_tasks,
        "overdue_tasks": overdue_tasks,
        "new_customers_week": new_customers_week
    }

@api_router.get("/crm/leads")
async def get_leads(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Get all leads
    """
    query = {}
    if status:
        query["status"] = status
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return leads

@api_router.post("/crm/leads", response_model=Lead)
async def create_lead(
    lead: LeadCreate,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new lead
    """
    lead_dict = lead.model_dump()
    lead_dict["id"] = str(uuid.uuid4())
    lead_dict["created_at"] = datetime.now(timezone.utc)
    lead_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.leads.insert_one(lead_dict)
    return Lead(**lead_dict)

@api_router.put("/crm/leads/{lead_id}")
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a lead
    """
    update_data = lead_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.leads.update_one(
        {"id": lead_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    updated_lead = await db.leads.find_one({"id": lead_id})
    return updated_lead

@api_router.put("/crm/order/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Update order status for CRM
    """
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create note about status change
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if order:
        note_dict = {
            "id": str(uuid.uuid4()),
            "customer_id": order["buyer_id"],
            "author_id": current_user.id,
            "author_name": current_user.full_name,
            "note": f"Статус заказа #{order.get('order_number', order_id[:8])} изменен на: {status}",
            "type": "order_update",
            "created_at": datetime.now(timezone.utc)
        }
        await db.customer_notes.insert_one(note_dict)
    
    return {"success": True, "order_id": order_id, "new_status": status}

# ============= POPULAR CATEGORIES =============

@api_router.get("/popular-categories")
async def get_popular_categories():
    """
    Get all active popular categories (public endpoint)
    """
    categories = await db.popular_categories.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    return categories

@api_router.get("/admin/popular-categories")
async def get_all_popular_categories(current_user: User = Depends(get_current_admin)):
    """
    Get all popular categories (admin only) - returns ALL categories including inactive
    """
    categories = await db.popular_categories.find({}, {"_id": 0}).sort("order", 1).to_list(1000)
    return categories


@api_router.put("/admin/products/{product_id}/bestseller")
async def toggle_product_bestseller(
    product_id: str,
    is_bestseller: bool,
    current_user: User = Depends(get_current_admin)
):
    """
    Toggle product bestseller status (admin only)
    """
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"is_bestseller": is_bestseller, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True, "product_id": product_id, "is_bestseller": is_bestseller}

    categories = await db.popular_categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)


# ============= PROMOTIONS (АКЦИИ) =============

@api_router.get("/promotions")
async def get_promotions():
    """
    Get all active promotions (public endpoint)
    """
    promotions = await db.promotions.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    return promotions

@api_router.get("/promotions/{promotion_id}")
async def get_promotion(promotion_id: str):
    """
    Get single promotion by ID (public endpoint)
    """
    promotion = await db.promotions.find_one({"id": promotion_id, "active": True}, {"_id": 0})
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return promotion

@api_router.get("/admin/promotions")
async def get_all_promotions(current_user: User = Depends(get_current_admin)):
    """
    Get all promotions (admin only)
    """
    promotions = await db.promotions.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return promotions

@api_router.post("/admin/promotions", response_model=Promotion)
async def create_promotion(
    promotion: PromotionCreate,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a promotion (admin only)
    """
    promotion_dict = promotion.model_dump()
    promotion_dict["id"] = str(uuid.uuid4())
    promotion_dict["created_at"] = datetime.now(timezone.utc)
    promotion_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.promotions.insert_one(promotion_dict)
    return Promotion(**promotion_dict)

@api_router.put("/admin/promotions/{promotion_id}", response_model=Promotion)
async def update_promotion(
    promotion_id: str,
    promotion_update: PromotionUpdate,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a promotion (admin only)
    """
    update_data = promotion_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.promotions.update_one(
        {"id": promotion_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    updated_promotion = await db.promotions.find_one({"id": promotion_id}, {"_id": 0})
    return Promotion(**updated_promotion)

@api_router.delete("/admin/promotions/{promotion_id}")
async def delete_promotion(
    promotion_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Delete a promotion (admin only)
    """
    result = await db.promotions.delete_one({"id": promotion_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    return {"message": "Promotion deleted successfully"}

    return categories

@api_router.post("/admin/popular-categories", response_model=PopularCategory)
async def create_popular_category(
    category: PopularCategoryCreate,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a popular category (admin only)
    """
    category_dict = category.model_dump()
    category_dict["id"] = str(uuid.uuid4())
    category_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.popular_categories.insert_one(category_dict)
    
    # Return the created category without _id
    created_category = await db.popular_categories.find_one({"id": category_dict["id"]}, {"_id": 0})
    return PopularCategory(**created_category)


# ============= ACTUAL OFFERS =============

@api_router.get("/actual-offers")
async def get_actual_offers():
    """
    Get all active actual offers (public endpoint)
    """
    offers = await db.actual_offers.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    return offers

@api_router.get("/actual-offers/{offer_id}")
async def get_actual_offer(offer_id: str):
    """
    Get single actual offer by ID with products (public endpoint)
    """
    offer = await db.actual_offers.find_one({"id": offer_id, "active": True}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Get products for this offer
    if offer.get("product_ids"):
        products = await db.products.find(
            {"id": {"$in": offer["product_ids"]}},
            {"_id": 0}
        ).to_list(100)
        offer["products"] = products
    else:
        offer["products"] = []
    
    return offer

@api_router.get("/admin/actual-offers")
async def get_all_actual_offers(current_user: User = Depends(get_current_admin)):
    """
    Get all actual offers (admin only)
    """
    offers = await db.actual_offers.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return offers

@api_router.post("/admin/actual-offers", response_model=ActualOffer)
async def create_actual_offer(
    offer: ActualOfferCreate,
    current_user: User = Depends(get_current_admin)
):
    """
    Create an actual offer (admin only)
    """
    offer_dict = offer.model_dump()
    offer_dict["id"] = str(uuid.uuid4())
    offer_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.actual_offers.insert_one(offer_dict)
    return ActualOffer(**offer_dict)

@api_router.put("/admin/actual-offers/{offer_id}", response_model=ActualOffer)
async def update_actual_offer(
    offer_id: str,
    offer_update: ActualOfferUpdate,
    current_user: User = Depends(get_current_admin)
):
    """
    Update an actual offer (admin only)
    """
    update_data = offer_update.model_dump(exclude_unset=True)
    
    result = await db.actual_offers.update_one(
        {"id": offer_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    updated_offer = await db.actual_offers.find_one({"id": offer_id}, {"_id": 0})
    return ActualOffer(**updated_offer)

@api_router.delete("/admin/actual-offers/{offer_id}")
async def delete_actual_offer(
    offer_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Delete an actual offer (admin only)
    """
    result = await db.actual_offers.delete_one({"id": offer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    return {"message": "Actual offer deleted successfully"}

    return PopularCategory(**category_dict)

@api_router.put("/admin/popular-categories/{category_id}", response_model=PopularCategory)
async def update_popular_category(
    category_id: str,
    category_update: PopularCategoryUpdate,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a popular category (admin only)
    """
    update_data = category_update.model_dump(exclude_unset=True)
    
    result = await db.popular_categories.update_one(
        {"id": category_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    updated_category = await db.popular_categories.find_one({"id": category_id}, {"_id": 0})
    return PopularCategory(**updated_category)

@api_router.delete("/admin/popular-categories/{category_id}")
async def delete_popular_category(
    category_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Delete a popular category (admin only)
    """
    result = await db.popular_categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Popular category deleted successfully"}

# ============= CUSTOM SECTIONS API =============

@api_router.get("/custom-sections", response_model=List[CustomSection])
async def get_custom_sections():
    """
    Get all active custom sections for frontend (sorted by order)
    """
    sections = await db.custom_sections.find(
        {"active": True, "display_on_home": True},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return [CustomSection(**section) for section in sections]

@api_router.get("/custom-sections/{slug}")
async def get_custom_section_by_slug(slug: str):
    """
    Get a specific custom section by slug
    """
    section = await db.custom_sections.find_one({"slug": slug, "active": True}, {"_id": 0})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Получаем товары для этого раздела
    products = []
    if section.get("product_ids"):
        products = await db.products.find(
            {"id": {"$in": section["product_ids"]}},
            {"_id": 0}
        ).to_list(100)
    
    return {
        "section": CustomSection(**section),
        "products": [Product(**p) for p in products]
    }

@api_router.get("/admin/custom-sections", response_model=List[CustomSection])
async def get_all_custom_sections_admin(current_user: User = Depends(get_current_admin)):
    """
    Get all custom sections (including inactive) for admin panel
    """
    sections = await db.custom_sections.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return [CustomSection(**section) for section in sections]

@api_router.post("/admin/custom-sections", response_model=CustomSection)
async def create_custom_section(
    section: CustomSectionCreate,
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new custom section (admin only)
    """
    # Проверяем уникальность slug
    existing = await db.custom_sections.find_one({"slug": section.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Section with this slug already exists")
    
    section_dict = section.model_dump()
    section_dict["id"] = str(uuid.uuid4())
    section_dict["created_at"] = datetime.now(timezone.utc)
    section_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.custom_sections.insert_one(section_dict)
    return CustomSection(**section_dict)

@api_router.put("/admin/custom-sections/{section_id}", response_model=CustomSection)
async def update_custom_section(
    section_id: str,
    section_update: CustomSectionUpdate,
    current_user: User = Depends(get_current_admin)
):
    """
    Update a custom section (admin only)
    """
    update_data = section_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Если обновляется slug, проверяем уникальность
    if "slug" in update_data:
        existing = await db.custom_sections.find_one({
            "slug": update_data["slug"],
            "id": {"$ne": section_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Section with this slug already exists")
    
    result = await db.custom_sections.update_one(
        {"id": section_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    
    updated_section = await db.custom_sections.find_one({"id": section_id}, {"_id": 0})
    return CustomSection(**updated_section)

@api_router.delete("/admin/custom-sections/{section_id}")
async def delete_custom_section(
    section_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Delete a custom section (admin only)
    """
    result = await db.custom_sections.delete_one({"id": section_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    
    return {"message": "Custom section deleted successfully"}

@api_router.post("/admin/custom-sections/{section_id}/products/{product_id}")
async def add_product_to_section(
    section_id: str,
    product_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Add a product to a custom section (admin only)
    """
    # Проверяем существование товара
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Добавляем товар в раздел
    result = await db.custom_sections.update_one(
        {"id": section_id},
        {"$addToSet": {"product_ids": product_id}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Section not found or product already in section")
    
    return {"message": "Product added to section successfully"}

@api_router.delete("/admin/custom-sections/{section_id}/products/{product_id}")
async def remove_product_from_section(
    section_id: str,
    product_id: str,
    current_user: User = Depends(get_current_admin)
):
    """
    Remove a product from a custom section (admin only)
    """
    result = await db.custom_sections.update_one(
        {"id": section_id},
        {"$pull": {"product_ids": product_id}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    
    return {"message": "Product removed from section successfully"}


# ============= SEO ENDPOINTS FOR GOOGLE ADS =============
from fastapi.responses import Response

@api_router.get("/sitemap.xml", response_class=Response)
async def get_sitemap():
    """
    Generate XML sitemap for SEO and Google Ads optimization
    """
    try:
        # Get all products and categories
        products = await db.products.find({}, {"_id": 0, "id": 1, "updated_at": 1}).to_list(1000)
        categories = await db.categories.find({}, {"_id": 0, "id": 1, "updated_at": 1}).to_list(1000)
        
        site_url = os.environ.get('SITE_URL', 'https://ystore.ua')
        
        # Build sitemap XML
        xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        
        # Homepage
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{site_url}/</loc>\n'
        xml_content += '    <changefreq>daily</changefreq>\n'
        xml_content += '    <priority>1.0</priority>\n'
        xml_content += '  </url>\n'
        
        # Categories
        for category in categories:
            xml_content += '  <url>\n'
            xml_content += f'    <loc>{site_url}/products?category_id={category["id"]}</loc>\n'
            xml_content += '    <changefreq>weekly</changefreq>\n'
            xml_content += '    <priority>0.8</priority>\n'
            xml_content += '  </url>\n'
        
        # Products
        for product in products:
            last_mod = product.get('updated_at', datetime.now(timezone.utc))
            if isinstance(last_mod, str):
                last_mod = datetime.fromisoformat(last_mod.replace('Z', '+00:00'))
            
            xml_content += '  <url>\n'
            xml_content += f'    <loc>{site_url}/product/{product["id"]}</loc>\n'
            xml_content += f'    <lastmod>{last_mod.strftime("%Y-%m-%d")}</lastmod>\n'
            xml_content += '    <changefreq>weekly</changefreq>\n'
            xml_content += '    <priority>0.9</priority>\n'
            xml_content += '  </url>\n'
        
        xml_content += '</urlset>'
        
        return Response(content=xml_content, media_type="application/xml")
    
    except Exception as e:
        logging.error(f"Error generating sitemap: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate sitemap")


@api_router.get("/robots.txt", response_class=Response)
async def get_robots_txt():
    """
    Generate robots.txt for search engine crawlers
    """
    site_url = os.environ.get('SITE_URL', 'https://ystore.ua')
    
    robots_content = f"""User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /checkout
Disallow: /cart

# Sitemap
Sitemap: {site_url}/api/sitemap.xml

# Crawl-delay for better server performance
Crawl-delay: 1
"""
    
    return Response(content=robots_content, media_type="text/plain")


# ============= INITIALIZE APP =============

# Import production-ready modular routers
from modules.orders.routes import router as orders_v2_router
from modules.payments.routes import router as payments_v2_router
from modules.delivery.routes_v2 import router as delivery_v2_router

# O1-O8: Import new operational routers
from modules.ops.analytics.shipping_analytics_routes import router as shipping_analytics_router
from modules.ops.dashboard.dashboard_routes import router as ops_dashboard_router
from modules.finance.finance_routes import router as finance_router
from modules.crm.crm_routes import router as crm_router
from modules.crm.actions.crm_actions_routes import router as crm_actions_router

# O13-O18: Import Guard, Risk, Timeline, Analytics routers
from modules.guard.guard_routes import router as guard_router
from modules.risk.risk_routes import router as risk_router
from modules.timeline.timeline_routes import router as timeline_router
from modules.analytics_intel.analytics_routes import router as analytics_router

# Include legacy api_router
app.include_router(api_router)

# Include production-ready modular routers with /api prefix
# These provide state machine, optimistic locking, and Fondy integration
app.include_router(orders_v2_router, prefix="/api/v2", tags=["Orders V2 (Production)"])
app.include_router(payments_v2_router, prefix="/api/v2", tags=["Payments V2 (Fondy)"])
app.include_router(delivery_v2_router, prefix="/api/v2", tags=["Delivery V2 (Nova Poshta TTN)"])

# O1-O8: Include operational routers
app.include_router(shipping_analytics_router, prefix="/api/v2/admin", tags=["Shipping Analytics"])
app.include_router(ops_dashboard_router, prefix="/api/v2/admin", tags=["Ops Dashboard"])
app.include_router(finance_router, prefix="/api/v2/admin", tags=["Finance"])
app.include_router(crm_router, prefix="/api/v2/admin", tags=["CRM"])
app.include_router(crm_actions_router, prefix="/api/v2/admin", tags=["CRM Actions"])

# O13-O18: Include Guard, Risk, Timeline, Analytics routers
app.include_router(guard_router, prefix="/api/v2/admin", tags=["Guard (Fraud/KPI)"])
app.include_router(risk_router, prefix="/api/v2/admin", tags=["Risk Score"])
app.include_router(timeline_router, prefix="/api/v2/admin", tags=["Customer Timeline"])
app.include_router(analytics_router, prefix="/api/v2/admin", tags=["Analytics Intelligence"])

# O20: Pickup Control router
from modules.pickup_control.pickup_routes import router as pickup_control_router
app.include_router(pickup_control_router, prefix="/api/v2/admin", tags=["Pickup Control"])

# O20.3: Return Management router
from modules.returns.return_routes import router as returns_router
app.include_router(returns_router, prefix="/api/v2/admin", tags=["Returns Management"])

# O20.5: Return Policy router
from modules.returns.policy_routes import router as policy_router
app.include_router(policy_router, prefix="/api/v2/admin/returns", tags=["Return Policy"])

# D-Mode: Smart Payment Flow routers
from modules.payments.payments_policy_routes import router as payments_policy_router
from modules.payments.resume_routes import router as resume_router
from modules.payments.retry.retry_routes import router as retry_router
from modules.payments.recovery_analytics_routes import router as recovery_router
from modules.payments.reconciliation_routes import router as recon_router
from modules.payments.fondy_routes import router as fondy_router
from modules.payments.payment_health_routes import router as payment_health_router

app.include_router(payments_policy_router)
app.include_router(resume_router)
app.include_router(retry_router)
app.include_router(recovery_router)
app.include_router(recon_router)
app.include_router(fondy_router)
app.include_router(payment_health_router, prefix="/api", tags=["Payment Health Dashboard"])

# Risk routes also on /api for frontend compatibility
from modules.risk.risk_routes import router as risk_api_router
app.include_router(risk_api_router, prefix="/api", tags=["Risk Center"])

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@app.on_event("startup")
async def startup_init():
    """Initialize database indexes for production-ready modules"""
    logger.info("🚀 Initializing production-ready indexes...")
    
    # Orders indexes - with optimistic locking support
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("user_id")
    await db.orders.create_index("status")
    await db.orders.create_index("created_at")
    
    # Payment events - webhook idempotency
    await db.payment_events.create_index(
        [("provider", 1), ("provider_event_id", 1)], 
        unique=True
    )
    await db.payment_events.create_index("order_id")
    await db.payment_events.create_index("signature_hash", unique=True, sparse=True)
    
    # Shipment events - TTN idempotency (Nova Poshta)
    await db.shipment_events.create_index(
        [("provider", 1), ("event_id", 1)],
        unique=True
    )
    await db.shipment_events.create_index("order_id")
    
    # Idempotency keys - general API idempotency
    await db.idempotency_keys.create_index("key_hash", unique=True)
    await db.idempotency_keys.create_index("expires_at", expireAfterSeconds=0)
    
    # O2: Domain events (outbox)
    await db.domain_events.create_index("status")
    await db.domain_events.create_index("next_retry_at")
    
    # O2: Notification queue
    await db.notification_queue.create_index("status")
    await db.notification_queue.create_index("dedupe_key", unique=True, sparse=True)
    
    # O5: Finance ledger
    await db.finance_ledger.create_index("order_id")
    await db.finance_ledger.create_index("created_at")
    await db.finance_ledger.create_index("type")
    
    # O5: Customers CRM
    await db.customers.create_index("phone", unique=True)
    await db.customers.create_index("segment")
    
    logger.info("✅ Production indexes created")
    
    # O1+O2: Start background jobs scheduler
    try:
        from modules.jobs.scheduler import start_jobs_scheduler
        start_jobs_scheduler(db)
        logger.info("✅ Background jobs scheduler started")
    except Exception as e:
        logger.error(f"Failed to start jobs scheduler: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()