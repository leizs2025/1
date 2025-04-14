const AUTH_USER = "admin";
const AUTH_PASS = "123456";

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (user === AUTH_USER && pass === AUTH_PASS) {
    localStorage.setItem("loggedIn", "1");
    location.href = "index.html";
  } else {
    alert("账号或密码错误！");
  }
}

function checkLogin() {
  if (localStorage.getItem("loggedIn") !== "1") {
    location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  location.href = "login.html";
}
