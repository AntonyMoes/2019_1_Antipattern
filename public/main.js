
const AjaxModule = window.AjaxModule;

let root = document.getElementById("root");

function temp(xhr) {
  let raw = xhr.responseText;
  let compiled = Handlebars.compile(raw);
  root.innerHTML = compiled();
};

function createPage(pageName) {
  AjaxModule.doGet(
    {callback:temp,
    path:pages[pageName],
  });
  window.history.pushState("object or string", "Title", "" + pageName);
}

const pages = {
  menu: '/menu.html',
  login: '/login.html',
  signUp: '/signup.html',
  leaders: '/leaderboard.html',
	me: '/profile.html'
};

createPage('menu');

root.addEventListener('click', function (event) {
	if (!(event.target instanceof HTMLAnchorElement)) {
		return;
	}

	event.preventDefault();
	const link = event.target;

	console.log({
		href: link.name,
		dataHref: link.dataset.href
	});
  createPage(link.name);
});

window.onpopstate = function( e ) {
    e.preventDefault();
    let returnLocation = window.history.location || document.location;
    // console.log(returnLocation.pathname);
    createPage( returnLocation.pathname.substr(1));
}

window.onpushstate = function( e ) {
    e.preventDefault();
    let returnLocation = window.history.location || document.location;
    console.log(returnLocation.pathname);
    createPage( returnLocation.pathname.substr(1));
}

window.onload = function( e ) {
    e.preventDefault();
    let returnLocation = window.history.location || document.location;
    console.log(returnLocation.pathname);
    createPage( returnLocation.pathname.substr(1));
}
