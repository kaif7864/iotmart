from core.database import db
from bson import ObjectId

class CouponRepository:
    @property
    def collection(self):
        return db.coupons

    async def get_coupon_by_code(self, code: str):
        return await self.collection.find_one({"code": code.upper()})
    
    async def create_coupon(self, coupon_data: dict):
        coupon_data["code"] = coupon_data["code"].upper()
        return await self.collection.insert_one(coupon_data)

coupon_repo = CouponRepository()
