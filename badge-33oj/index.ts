import {
    db, definePlugin, UserModel, Handler, UserNotFoundError, NotFoundError, param, PermissionError, PRIV, Types, paginate, query
} from 'hydrooj';

class BadgeShowHandler extends Handler {
    @query('page', Types.PositiveInt, true)
    async get(domainId: string, page = 1) {
        const [dudocs, upcount, ucount] = await paginate(
            UserModel.getMulti({badge: { $exists: true, $ne: "" }}),
	page,
	100, 
	);
	const udict = await UserModel.getList(domainId, dudocs.map((x) => x._id));
        const udocs = dudocs.map((x) => udict[x._id]);
        this.response.template = 'badge_show.html'; // 返回此页面
        this.response.body = { udocs, upcount, ucount, page, udict };
    }
}

class BadgeCreateHandler extends Handler {
    async get() {
        this.response.template = 'badge_create.html'; // 返回此页面
    }
    @param('uidOrName', Types.UidOrName)
    @param('text', Types.String)
    @param('color', Types.String)
    @param('textColor', Types.String)
    async post(domainId: string, uidOrName: string, text: string, color: string, textColor: string) {
        // 检查输入
        let udoc = await UserModel.getByUname(domainId, uidOrName);
        if (!udoc)
            throw new UserNotFoundError(uidOrName);
        text = text.replace('\'', '').replace('\"', '');
        if (!text)
            throw new NotFoundError('text');
        if (!/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color) ||
            !/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(textColor))
            throw new NotFoundError('color');
        // 构建徽章代码并更新
        await UserModel.setById(udoc._id, { badge: text + color + textColor });
        // 将用户重定向到创建完成的url
        this.response.redirect = "/badge";
    }
}

class BadgeManageHandler extends Handler {
    @query('page', Types.PositiveInt, true)
    async get(domainId: string, page = 1) {
        const [dudocs, upcount, ucount] = await paginate(
            UserModel.getMulti({badge: { $exists: true, $ne: "" }}),
	page,
	100, 
	);
	const udict = await UserModel.getList(domainId, dudocs.map((x) => x._id));
        const udocs = dudocs.map((x) => udict[x._id]);
        this.response.template = 'badge_manage.html'; // 返回此页面
        this.response.body = { udocs, upcount, ucount, page, udict };
    }
}

class BadgeDelHandler extends Handler {
    @param('uid', Types.Int)
    async get(domainId: string, uid: number) {
        await UserModel.setById(uid, { badge: "" });
        this.response.redirect = "/badge/manage";
    }
}

export async function apply(ctx: Context) {
    ctx.Route('badge_show', '/badge', BadgeShowHandler, PRIV.PRIV_USER_PROFILE);
    ctx.Route('badge_create', '/badge/create', BadgeCreateHandler, PRIV.PRIV_CREATE_DOMAIN);
    ctx.Route('badge_manage', '/badge/manage', BadgeManageHandler, PRIV.PRIV_CREATE_DOMAIN);
    ctx.Route('badge_del', '/badge/manage/:uid/del', BadgeDelHandler, PRIV.PRIV_CREATE_DOMAIN);
}

