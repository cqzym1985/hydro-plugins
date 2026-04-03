import { $, addPage, NamedPage, UserSelectAutoComplete, Notification, delay, i18n, url, request } from '@hydrooj/ui-default'

addPage(new NamedPage(['realname_set','realname_resetpwd'], () => {
    UserSelectAutoComplete.getOrConstruct($('[name="uidOrName"]'), {
        clearDefaultValue: false,
    });
}));

addPage (new NamedPage('realname_set', () => {
  $(document).on('click', '[type="submit"]', async (ev) => {
    ev.preventDefault();

    const $form = $(ev.currentTarget).closest('form');
    try {
      const res = await request.post('', {
        uidOrName: $form.find('[name="uidOrName"]').val(),
        flag: $form.find('[name="flag"]').val(),
        name: $form.find('[name="name"]').val(),
      });
      if (res.url) {
        Notification.success(i18n('添加实名成功'));
        await delay(1000);
        window.location.href = res.url;  
      }
    } catch (e) {
      Notification.error(e.message);
    }
  });
}));

addPage (new NamedPage('realname_import', () => {
  async function post(draft) {
    try {
      const res = await request.post('', {
        realnames: $('[name="realnames"]').val(),
        draft,
      });
      if (!draft) {
        Notification.success(i18n('Updated {0} realname records.', res.realnames.length));
        await delay(2000);
        window.location.reload();
      } else {
        $('[name="messages"]').text(res.messages.join('\n'));
      }
    } catch (e) {
      Notification.error(e.message);
    }
  }

  $('[name="preview"]').on('click', () => post(true));
  $('[name="submit"]').on('click', () => post(false));
}));

addPage (new NamedPage('realname_resetpwd', () => {
  $(document).on('click', '[type="submit"]', async (ev) => {
    ev.preventDefault();

    const $form = $(ev.currentTarget).closest('form');
    try {
      const res = await request.post('', {
        uidOrName: $form.find('[name="uidOrName"]').val(),
        resetpwd: $form.find('[name="resetpwd"]').val(),
      });
      if (res.url) {
        Notification.success(i18n('重置密码成功'));
        await delay(1000);
        window.location.href = res.url;  
      }
    } catch (e) {
      Notification.error(e.message);
    }
  });
}));
