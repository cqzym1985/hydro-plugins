import { AutoloadPage, NamedPage, addPage } from '@hydrooj/ui-default';

//取消上传头像功能，将Gravatar替换成Wravatar
addPage(new NamedPage('home_account', () => {
  $('button.change-avatar').on('click', () => {
    const sel = document.getElementById("type");
    if (sel) {
      sel.options.remove(3); // upload
      sel.options.remove(1); // github
      sel.options[0].text = "Wravatar"; //需要将系统设置里的Gravatar地址前缀改成“//weavatar.com/avatar/”
      document.querySelector('.textbox').placeholder = "Email address";
    }
  });
}));

//去掉排行榜个人简介的部分，去掉边栏最近题目的时间
addPage(new NamedPage ('homepage', () => {
  $('.page--homepage .col--user').css('width', '30rem');
  $('.page--homepage .col--bio').empty();
  $('.section.side.nojs--hide .section__body p span[style*="float: right"]').remove();
}));

addPage(new AutoloadPage('nav_user_link_modifier', () => {
  const userLink = document.querySelector('a.nav__item[href*="/user/"]');
  if (userLink && UserContext?._id) {
    const domainId = UiContext.domainId || 'system';
    userLink.href = domainId === 'system'
      ? '/home/settings/domain'
      : `/d/${domainId}/home/settings/domain`;
    const displayName = UserContext.displayName || UserContext.uname;
    const iconSpan = userLink.querySelector('.icon-expand_more');
    userLink.textContent = `${displayName} `;
    if (iconSpan) userLink.appendChild(iconSpan);
  }
}));