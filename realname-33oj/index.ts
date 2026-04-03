import {
    db, UserModel, SettingModel, DomainModel, Handler, UserNotFoundError, param, PERM, PRIV, Types, query, requireSudo
} from 'hydrooj';

//实名设置
class RealnameSetHandler extends Handler {
    @query('uidOrName', Types.UidOrName, true)
    @query('name', Types.string, true)
    async get(domainId: string, uidOrName: string, name: string) {
        this.response.template = 'realname_set.html'; // 返回此页面
        this.response.body = { uidOrName, name };
    }
    @param('uidOrName', Types.UidOrName)
    @param('flag', Types.number, true)
    @param('name', Types.string, true)
    async post(domainId: string, uidOrName: string, flag: number, name: string) {
        // 检查输入
        flag = parseInt(flag, 10);
        const udoc = await UserModel.getById(domainId, +uidOrName)
            || await UserModel.getByUname(domainId, uidOrName)
            || await UserModel.getByEmail(domainId, uidOrName);
        if (!udoc)
            throw new UserNotFoundError(uidOrName);
        // 构建实名代码并更新
        if ([0, 1, 2].includes(flag)) await UserModel.setById(udoc._id, { realname_flag: flag });
        if (name) await UserModel.setById(udoc._id, { realname_name: name.trim() });
        this.response.redirect = this.url('realname_set');
    }
}

//展示实名用户
class RealnameShowHandler extends Handler {
    @query('page', Types.PositiveInt, true)
    @query('groupName', Types.string, true)
    async get(domainId: string, page = 1, groupName: string) {

        let filter = { realname_flag: { $exists: true, $ne: "" } };

        const groups = await UserModel.listGroup(domainId);
        if (groupName) {
            const groupInfo = groups.find(g => g.name === groupName);
            if (groupInfo) {
                filter._id = { $in: groupInfo.uids };
            }
        }

        const [dudocs, upcount] = await this.paginate(
            UserModel.getMulti(filter).sort({ realname_flag: -1, _id: -1 }),
            page,
            'ranking'
        );
        const udict = await UserModel.getList(domainId, dudocs.map((x) => x._id));
        const udocs = dudocs.map((x) => udict[x._id]);
        this.response.template = 'realname_show.html'; // 返回此页面
        this.response.body = { udocs, upcount, page, groupName, groups };
    }
}

//导入实名用户
class RealnameImportHandler extends Handler {
    async get() {
        this.response.body.realnames = [];
        this.response.template = 'realname_import.html';
    }

    @param('realnames', Types.Content)
    @param('draft', Types.Boolean)
    async post(domainId: string, _realnames: string, draft: boolean) {
        const realnames = _realnames.split('\n');
        const udocs: { username: string, flag: number, name: string }[] = [];
        const messages = [];

        for (const i in realnames) {
            const u = realnames[i];
            if (!u.trim()) continue;
            let [username, flag, name] = u.split('\t').map((t) => t.trim());
            if (username && !flag && !name) {
                const data = u.split(',').map((t) => t.trim());
                [username, flag, name] = data;
            }

            if (!username) continue;
            flag = parseInt(flag, 10);

            // 验证用户是否存在
            const user = await UserModel.getByUname(domainId, username);
            if (!user) {
                messages.push(`Line ${+i + 1}: User ${username} not found.`);
                continue;
            }

            udocs.push({
                username, flag, name
            });
        }
        messages.push(`${udocs.length} realname records found.`);

        if (!draft) {
            for (const udoc of udocs) {
                try {
                    const user = await UserModel.getByUname(domainId, udoc.username);
                    if (!user) continue;

                    if (![0, 1, 2].includes(udoc.flag) && udoc.name === '') {
                        await UserModel.setById(user._id, { realname_flag: '', realname_name: '' });
                    } else {
                        if ([0, 1, 2].includes(udoc.flag)) {
                            await UserModel.setById(user._id, { realname_flag: udoc.flag });
                        }
                        if (udoc.name) {
                            await UserModel.setById(user._id, { realname_name: udoc.name });
                        }
                    }
                } catch (e) {
                    messages.push(e.message);
                }
            }
        }
        this.response.body.realnames = udocs;
        this.response.body.messages = messages;
    }
}

//修改密码
class ResetPwdHandler extends Handler {
    @requireSudo
    @query('uidOrName', Types.UidOrName, true)
    async get(domainId: string, uidOrName: string) {
        this.response.template = 'realname_resetpwd.html'; // 返回此页面
        this.response.body = { uidOrName };
    }

    @requireSudo
    @param('uidOrName', Types.UidOrName)
    @param('resetpwd', Types.Password)
    async post(domainId: string, uidOrName: string, resetpwd: string) {
        // 检查输入
        const udoc = await UserModel.getById(domainId, +uidOrName)
            || await UserModel.getByUname(domainId, uidOrName)
            || await UserModel.getByEmail(domainId, uidOrName);
        if (!udoc)
            throw new UserNotFoundError(uidOrName);

        if ((udoc.hasPriv(PRIV.PRIV_SET_PERM) && udoc._id !== this.user._id) || udoc.hasPriv(PRIV.PRIV_EDIT_SYSTEM)) {
            this.checkPriv(PRIV.PRIV_ALL);
        }
        // 修改密码
        await UserModel.setPassword(udoc._id, resetpwd);
        this.response.redirect = this.url('realname_resetpwd');
    }
}

//快速认证
class RealnameQuickHandler extends Handler {
    @query('page', Types.PositiveInt, true)
    async get(domainId: string, page = 1) {
        const [dudocs, upcount] = await this.paginate(
            UserModel.getMulti({ "_id": { $gte: 2 }, $or: [ { "realname_name": { $exists: false } }, { "realname_name": "" } ] }).sort({ realname_flag: 1, _id: -1 }),
            page,
            'ranking'
        );
        const udict = await UserModel.getList(domainId, dudocs.map((x) => x._id));
        const udocs = dudocs.map((x) => udict[x._id]);

        this.response.template = 'realname_quick.html'; // 返回此页面
        this.response.body = { udocs, upcount, page };
    }
}

// 配置项及路由
export async function apply(ctx: Context) {
    ctx.inject(['setting'], (c) => {
        c.setting.AccountSetting(
            SettingModel.Setting('setting_info', 'realname_flag', 0, 'number', '身份标记', '0是未添加身份，1是学生，2是老师', 2),
            SettingModel.Setting('setting_info', 'realname_name', '', 'text', '姓名', null, 2)
        );
    });

    //修改getListForRender 
    const originalGetListForRender = UserModel.getListForRender;
    UserModel.getListForRender = async function(domainId, uids, arg, extraFields) {
        //添加realname相关字段
        const _extraFields = Array.isArray(arg) ? arg : Array.isArray(extraFields) ? extraFields : [];
        const newExtraFields = [..._extraFields, 'realname_name', 'realname_flag']; 
        if (Array.isArray(arg)) {
            return originalGetListForRender.call(this, domainId, uids, newExtraFields);
        }
        return originalGetListForRender.call(this, domainId, uids, arg, newExtraFields);
    };

    ctx.Route('realname_show', '/realname/show', RealnameShowHandler);
    ctx.Route('realname_set', '/realname/set', RealnameSetHandler, PRIV.PRIV_SET_PERM);
    ctx.Route('realname_import', '/realname/import', RealnameImportHandler, PRIV.PRIV_SET_PERM);
    ctx.Route('realname_quick', '/realname/quick', RealnameQuickHandler, PRIV.PRIV_SET_PERM);
    ctx.Route('realname_resetpwd', '/realname/resetpwd', ResetPwdHandler, PRIV.PRIV_SET_PERM);
    ctx.injectUI('UserDropdown', 'realname_show', { icon: 'feeling-lucky', displayName: '实名认证' });
    ctx.i18n.load('zh', {
        realname_show: '查看实名认证',
        realname_set: '添加实名认证',
        realname_import: '批量实名认证',
        realname_quick: '快速实名认证',
        realname_resetpwd: '重置密码',
    });
}
