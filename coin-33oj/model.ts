import { db, UserModel } from 'hydrooj';

const collcoin = db.collection('coin');  

interface Coin {
    _id: ObjectId;
    userId: number;
    rootId: number;
    amount: number;
    text: string;
    status: number;
}


declare module 'hydrooj' {
    interface Model {
        coin: typeof CoinModel;
    }
    interface Collections {
        coin: Coin;
    }
}

class CoinModel {
    static coll = collcoin;

    // 原子扣减余额（不写流水）  只有 coin_now >= amount 时才扣减，返回是否成功
    static async deduct(userId: number, amount: number): Promise<boolean> {
        const result = await UserModel.coll.findOneAndUpdate(
            { _id: userId, coin_now: { $gte: amount } },
            { $inc: { coin_now: -amount } },
        );
        if (!result) return false;
        // inc 0 不改数据库值，但会使 HydroOJ 用户缓存失效
        await UserModel.inc(userId, 'coin_now', 0);
        return true;
    }

    // 仅插入流水记录（不动余额）
    static async record(userId: number, rootId: number, amount: number, text: string, status?: number): Promise<void> {
        await CoinModel.coll.insertOne({
            userId, rootId, amount, text,
            ...(status !== undefined && { status }),
        });
    }

    static async inc(userId: number, rootId: number, amount: number, text: string, status?: number) {
        await CoinModel.record(userId, rootId, amount, text, status);
        await UserModel.inc(userId, 'coin_now', amount);
        if (amount > 0 ) {
            await UserModel.inc(userId, 'coin_all', amount);
        }
    }

    // 原子扣减 + 写流水（适用于单步操作，如改名扣费）
    static async decr(userId: number, rootId: number, amount: number, text: string, status?: number): Promise<boolean> {
        if (!await CoinModel.deduct(userId, amount)) return false;
        await CoinModel.record(userId, rootId, -amount, text, status);
        return true;
    }

    // 赠送：原子扣发送方 + 写双方流水 + 加接收方余额
    static async transfer(fromId: number, toId: number, amount: number, textFrom: string, textTo: string): Promise<boolean> {
        if (!await CoinModel.deduct(fromId, amount)) return false;
        await CoinModel.record(fromId, toId, -amount, textFrom);
        await CoinModel.record(toId, fromId, amount, textTo);
        await UserModel.inc(toId, 'coin_now', amount);
        return true;
    }

    static async getUserBill(userId: number) {
        const query = userId === 0 ? {} : { userId };
        return CoinModel.coll.find(query).sort({ _id: -1 });
    }

    static async getUserRecord(userId: number, statusFilter?: number) {  
        const query: any = {};  
        if (typeof statusFilter === 'number') {  
            query.status = statusFilter === 0 ? 0 : { $gte: 1 };  
        } else {  
            query.status = { $gte: 0 };  
        }  
        if (userId !== 0) {  
            query.userId = userId;  
        }  
        return CoinModel.coll.find(query).sort({ _id: -1 });  
    }

    static async getBill(billId: ObjectId): Promise<Coin> {
        return CoinModel.coll.findOne({ _id: billId });
    }

    static async deleteBill(billId: ObjectId): Promise<number> {
        const result = await CoinModel.coll.deleteOne({ _id: billId });
        return result.deletedCount;
    }

    static async updateBill(id: ObjectId, update: Partial<Coin>): Promise<number> {  
        const result = await CoinModel.coll.updateOne({ _id: id }, { $set: update });  
        return result.modifiedCount;
    }

    static async cancelBill(id: ObjectId) {  
        return CoinModel.coll.findOneAndUpdate(  
            { _id: id, status: { $gte: 1 } },  
            { $set: { status: -1 } },  
        );  
    }
}



global.Hydro.model.coin = CoinModel;

export { CoinModel };