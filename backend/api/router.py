from fastapi import APIRouter

from api.v1.products import router as product_router
from api.v1.orders import router as order_router
from api.v1.users import router as user_router
from api.v1.analytics import router as analytics_router
from api.v1.ai import router as ai_router
from api.v1.auth import router as auth_router
from api.v1.websocket import router as ws_router
from api.v1.nexar import router as nexar_router
from api.v1.circuits import router as circuit_router
from api.v1.parts import router as part_gen_router
from api.v1.transactions import router as transaction_router
from api.v1.payments import router as payments_router
from api.v1.coupons import router as coupons_router
from api.v1.support import router as support_router
from api.v1.settings import router as settings_router
from api.v1.logs import router as logs_router
from api.v1.notifications import router as notifications_router

api_router = APIRouter()

from api.deps import get_current_user
from fastapi import Depends

api_router.include_router(product_router, prefix="/products", tags=["Products"])
api_router.include_router(order_router, prefix="/orders", tags=["Orders"], dependencies=[Depends(get_current_user)])
api_router.include_router(user_router, prefix="/users", tags=["Users"], dependencies=[Depends(get_current_user)])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"], dependencies=[Depends(get_current_user)])
api_router.include_router(ai_router, prefix="/ai", tags=["AI"], dependencies=[Depends(get_current_user)])
api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(ws_router, tags=["WebSockets"])
api_router.include_router(nexar_router, tags=["Nexar"])
api_router.include_router(circuit_router, prefix="/circuits", tags=["Circuits"], dependencies=[Depends(get_current_user)])
api_router.include_router(part_gen_router, tags=["AI Part Gen"], dependencies=[Depends(get_current_user)])
api_router.include_router(transaction_router, prefix="/transactions", tags=["Transactions"], dependencies=[Depends(get_current_user)])
api_router.include_router(payments_router, prefix="/payments", tags=["Payments"], dependencies=[Depends(get_current_user)])
api_router.include_router(coupons_router, prefix="/coupons", tags=["Coupons"])
api_router.include_router(support_router, prefix="/support", tags=["Support"])
api_router.include_router(settings_router, prefix="/settings", tags=["Settings"])
api_router.include_router(logs_router, prefix="/logs", tags=["Logs"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"], dependencies=[Depends(get_current_user)])
