const socket = io();

const messageForm = document.querySelector("#message-form");
const messageFormInput = messageForm.querySelector("input");
const locationSendBtn = document.querySelector("#send-location");
const messageFormBtn = messageForm.querySelector("button");
const messages = document.querySelector("#messages");
const sidebar = document.querySelector("#sidebar");
const messagesTemplate = document.querySelector("#message-template").innerHTML;
const locationsTemplate =
  document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  const newMessage = messages.lastElementChild;
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;
  const visibleHeight = messages.offsetHeight;
  const contentHeight = messages.scrollHeight;
  const scrollOffset = messages.scrollTop + visibleHeight;
  if (contentHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", ({ username, text, createdAt }) => {
  console.log(text);
  const html = Mustache.render(messagesTemplate, {
    username,
    message: text,
    createdAt: moment(createdAt).format("H:mm"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", ({ username, url, createdAt }) => {
  console.log(url);
  const html = Mustache.render(locationsTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format("H:mm"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  sidebar.innerHTML = html;
});

const submitText = (e) => {
  e.preventDefault();
  messageFormBtn.disabled = true;
  const text = e.target.elements.message.value;
  socket.emit("sendMessage", text, (error) => {
    messageFormBtn.disabled = false;
    messageFormInput.value = "";
    messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("The message was delivered");
  });
};

messageForm.addEventListener("submit", submitText);

const sendLocation = () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }
  locationSendBtn.disabled = true;
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    socket.emit(
      "shareLocation",
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      () => {
        locationSendBtn.disabled = false;
        console.log("Delivered");
      }
    );
  });
};

locationSendBtn.addEventListener("click", sendLocation);

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
