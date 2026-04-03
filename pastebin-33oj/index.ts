import {
    Context, UserModel, Handler, NotFoundError, param, PRIV, Types, query
} from 'hydrooj';
import { PastebinModel } from './model';

class PasteCreateHandler extends Handler {
    async get() {
        this.response.template = 'paste_create.html';
    }
    @param('title', Types.Title)
    @param('content', Types.Content)
    @param('isprivate', Types.Boolean)
    async post(domainId: string, title: string, content: string, isprivate: boolean = false) {
        const pasteid = await PastebinModel.add(this.user._id, title, content, isprivate);
        this.response.redirect = this.url('paste_detail', { id: pasteid });
    }
}

class PasteEditHandler extends Handler {
    @param('id', Types.String)
    async get(domainId: string, id: string) {
        const doc = await PastebinModel.get(id);
        if (!doc) throw new NotFoundError(`剪贴板 ${id} 不存在！`);
        if (this.user._id !== doc.owner) {
            this.checkPriv(PRIV.PRIV_SET_PERM);
        }
        this.response.template = 'paste_edit.html';
        this.response.body = { doc };
    }
    @param('id', Types.String)
    @param('title', Types.Title)
    @param('content', Types.Content)
    @param('isprivate', Types.Boolean)
    async postUpdate(domainId: string, id: string, title: string, content: string, isprivate: boolean = false) {
        const doc = await PastebinModel.get(id);
        if (!doc) throw new NotFoundError(`剪贴板 ${id} 不存在！`);
        if (this.user._id !== doc.owner) {
            this.checkPriv(PRIV.PRIV_SET_PERM);
        }
        await PastebinModel.edit(id, title, content, isprivate);
        this.response.redirect = this.url('paste_detail', { id });
    }

    @param('id', Types.String)
    async postDelete(domainId: string, id: string) {
        const doc = await PastebinModel.get(id);
        if (!doc) throw new NotFoundError(`剪贴板 ${id} 不存在！`);
        if (this.user._id !== doc.owner) {
            this.checkPriv(PRIV.PRIV_SET_PERM);
        }
        await PastebinModel.del(id);
        this.response.redirect = this.url('paste_manage');
    }
}

class PasteDetailHandler extends Handler {
    @param('id', Types.String)
    async get(domainId: string, id: string) {
        const doc = await PastebinModel.get(id);
        if (!doc) throw new NotFoundError(id);
        if (doc.isprivate && this.user._id !== doc.owner) {
            this.checkPriv(PRIV.PRIV_SET_PERM);
        }
        const udoc = await UserModel.getById(domainId, doc.owner);
        this.response.body = { doc, udoc };
        this.response.template = 'paste_detail.html';
    }
}

class PasteManageHandler extends Handler {
    @query('uid', Types.Int, true)
    @query('page', Types.PositiveInt, true)
    async get(domainId: string, uid = this.user._id, page = 1) {
        //管理员能看所有，其他人只能看自己的
        if (uid !== this.user._id)
            this.checkPriv(PRIV.PRIV_SET_PERM);
        // id 为 0 即查看所有人
        const [pastes, upcount] = await this.paginate(
            await PastebinModel.getUserPaste(uid),
            page,
            'ranking'
        );

        // 获取所有相关的用户信息
        const uids = new Set<number>([
            ...pastes.map((x) => x.owner),
        ]);
        const udict = await UserModel.getList(domainId, Array.from(uids));

        this.response.template = 'paste_manage.html';
        this.response.body = { uid, pastes, upcount, page, udict };
    }
}

export async function apply(ctx: Context) {
    ctx.Route('paste_create', '/paste/create', PasteCreateHandler, PRIV.PRIV_USER_PROFILE);
    ctx.Route('paste_manage', '/paste/manage', PasteManageHandler, PRIV.PRIV_USER_PROFILE);
    ctx.Route('paste_detail', '/paste/detail/:id', PasteDetailHandler, PRIV.PRIV_USER_PROFILE);
    ctx.Route('paste_edit', '/paste/detail/:id/edit', PasteEditHandler, PRIV.PRIV_USER_PROFILE);
    ctx.injectUI('UserDropdown', 'paste_manage', { icon: 'copy', displayName: '我的剪贴板' });
    ctx.i18n.load('zh', {
        paste_create: '新建剪贴板',
        paste_manage: '管理剪贴板',
        paste_detail: '查看剪贴板',
        paste_edit: '编辑剪贴板',
    });
}