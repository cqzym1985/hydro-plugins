import { db, UserModel, randomstring } from 'hydrooj';

const coll = db.collection('paste');

interface Paste {
    _id: string;
    updateAt: Date;
    title: string;
    owner: number;
    content: string;
    isprivate: boolean;
}

declare module 'hydrooj' {
    interface Model {
        pastebin: typeof PastebinModel;
    }
    interface Collections {
        paste: Paste;
    }
}

class PastebinModel {
    static coll = coll;
 
    static async add(userId: number, title: string, content: string, isprivate: boolean): Promise<string> {
        const pasteId = randomstring(16); // 生成16位随机字符串
        const result = await PastebinModel.coll.insertOne({
            _id: pasteId,
            updateAt: new Date(),
            title,
            owner: userId,
            content,
            isprivate
        });
        return pasteId; // 直接返回 pasteId，更清晰
    }

    static async edit(pasteId: string, title: string, content: string, isprivate: boolean): Promise<number> {
        const result = await PastebinModel.coll.updateOne({ _id: pasteId }, {
            $set: {
                title,
                updateAt: new Date(),
                content,
                isprivate
            }
        });
        return result.modifiedCount;
    }

    static async get(pasteId: string): Promise<Paste | null> {
        return await PastebinModel.coll.findOne({ _id: pasteId });
    }

    static async getUserPaste(userId: number) {
        const query = userId === 0 ? {} : { owner: userId };
        return await PastebinModel.coll.find(query).sort({ updateAt: -1, _id: -1 });
    }

    static async del(pasteId: string): Promise<number> {
        const result = await PastebinModel.coll.deleteOne({ _id: pasteId });
        return result.deletedCount;
    }
}

global.Hydro.model.pastebin = PastebinModel;
export { PastebinModel };