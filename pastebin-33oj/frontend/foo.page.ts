import { $, addPage, NamedPage, UserSelectAutoComplete, Notification, delay, i18n, url, request, ConfirmDialog, tpl } from '@hydrooj/ui-default'

addPage (new NamedPage('paste_create', () => {
  $(document).on('click', '[type="submit"]', async (ev) => {
    ev.preventDefault();

    const $form = $(ev.currentTarget).closest('form');
    try {
      const res = await request.post('', {
        title: $form.find('[name="title"]').val(),
        content: $form.find('[name="content"]').val(),
        isprivate: $form.find('[name="isprivate"]').is(':checked'),
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (e) {
      Notification.error(e.message);
    }
  });
}));

addPage(new NamedPage('paste_edit', () => {
  $(document).on('click', '[name="operation"][value="update"]', async (ev) => {
    ev.preventDefault();

    const $form = $(ev.currentTarget).closest('form');
    try {
      const res = await request.post('', {
        operation: 'update',
        id: $form.find('[name="id"]').val(),
        title: $form.find('[name="title"]').val(),
        content: $form.find('[name="content"]').val(),
        isprivate: $form.find('[name="isprivate"]').is(':checked'),
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (e) {
      Notification.error(e.message);
    }
  });

  $(document).on('click', '[name="operation"][value="delete"]', async (ev) => {
    ev.preventDefault();
    const message = '确认删除此剪贴板吗？删除后将无法恢复。';
    const action = await new ConfirmDialog({
        $body: tpl`
            <div class="typo">
                <p>${i18n(message)}</p>
            </div>`,
    }).open();
    if (action !== 'yes') return;

    try {
        const res = await request.post('', { operation: 'delete' });
        if (res.url) {
            window.location.href = res.url;
        }
    } catch (e) {
        Notification.error(e.message);
    }
  });
}));
