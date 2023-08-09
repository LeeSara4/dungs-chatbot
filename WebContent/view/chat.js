const url = "http://192.168.0.109:8080/foodChatBot/chat";
const message = document.getElementById("chat");
const submit = document.getElementById("submit");
const chatLog = document.getElementById("chatLog");
const resolved = document.getElementById("resolved");
const listBox = document.getElementById("listBox");

let optionList = [];
let nope = 0;
let foodList = [];

function firstMsg() {
  addMessage("anotherMsg", "안녕하세요. 음식 추천을 도와드릴 Dungs 입니다!");
  addMessage("anotherMsg", "아무 말이나 적어보세요!");
}

function setResolved() {
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      foodList.push(...data.list);
      foodList.forEach((itemText) => {
        const listItem = document.createElement("div");
        listItem.className = "list-item";
        listItem.textContent = itemText;
        listBox.appendChild(listItem);
      });
    });
}

function setFoodList() {
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      foodList.push(...data.list);
    });
}

function addOptionList(obj) {
  optionList.push(obj);
}

function fetchData(obj, method) {
  return fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify(obj),
  });
}

function send(e) {
  if (e !== null) {
    e.preventDefault();
  }

  if (message.value.trim() === "") {
    return;
  }
  // '난 메뉴가 있어' 처리
  addMessage("myMsg", message.value);
  fetchData({ chat: message.value }, "POST")
    .then((resp) => resp.json())
    .then(handleResponse);
  message.value = "";
}

function addFood(e) {
  if (e !== null) {
    e.preventDefault();
  }
  if (foodList.includes(message.value)) {
    handleOptionSelect(message.value, "food");
  } else {
    addMessage("myMsg", message.value);
    addMessage("anotherMsg", "다른음식은 어떤게 있어요?");
    toast("미리보기에 있는 음식으로 입력해주세요", "error");
  }
  message.value = "";
}

function handleResponse(data) {
  // 추천의 답 -> chat : Y/N 날려줌
  if (data.answer !== undefined) {
    if (data.answer === "") {
      addMessage(
        "anotherMsg",
        "이해가 잘 안되네요. 어려운 말이 있나 봐요. 다시 말해줄 수 있을까요?"
      );
    } else {
      chatBotAnswer();
      addOptionList((obj = { request: data.answer }));
      localStorage.setItem("keyword", data.answer);
      addMessage("anotherMsg", data.answer + " 어때요?");
      addImg(
        "anotherMsg",
        "<img src = '" +
          data.img +
          "' referrerpolicy='no-referrer' height = '300' />"
      );
      addOptions(["좋아요!", "별로에요.."], "request");
    }
  }
  // 모르는 단어의 답 -> 단어의 정보들 날려줌
  if (data.request !== undefined) {
    addOptionList((obj = { request: data.request }));
    addMessage(
      "anotherMsg",
      "모르는 단어가 포함되어 있었어요... '" + data.request + "' 이(가) 뭐에요?"
    );
    addOptions(["사람", "날씨", "장소", "행동", "예산", "양"], "category");
    addOptions(["음식", "재료", "맛"], "category");
  }
}

function addOptions(options, id) {
  setTimeout(() => {
    message.disabled = true;
    submit.disabled = true;
    const optionsElement = document.createElement("div");
    optionsElement.id = "optionsDiv";
    options.forEach((option) => {
      const button = document.createElement("button");
      button.textContent = option;
      button.onclick = () => handleOptionSelect(option, id);
      optionsElement.appendChild(button);
    });
    chatLog.appendChild(optionsElement);
    scrollToBottom();
  }, 1500);
}

function handleOptionSelect(option, id) {
  message.disabled = false;
  submit.disabled = false;
  const obj = {
    [id]: option,
  };
  addOptionList(obj);
  console.log(optionList);
  addMessage("myMsg", option);
  if (id === "chat" || id === "request") {
    optionList.pop();
  }
  if (id === "request") {
    if (option === "별로에요..") {
      nope = nope + 1;
      addOptionList({ category: "거절" });
      addMessage("anotherMsg", "그럼 어떤게 먹고 싶어요?");
      toast("선호하는 맛을 이야기 해보세요!", "info");
    } else {
      addOptionList({ category: "수락" });
      addMessage("anotherMsg", "근처 음식점을 소개해줄게요!");
      addImg(
        "anotherMsg",
        "<a href = 'view/location.html'>음식점 보러가기</a>"
      );
    }
    fetchData(optionList, "PUT");
    optionList = [];
  } else if (option === "음식" || option === "안돼") {
    if (option === "음식") {
      addMessage("anotherMsg", "메뉴에 저장했어요.");
    } else {
      addMessage("anotherMsg", "네! 저장했어요.");
    }
    fetchData(optionList, "PUT");
    optionList = [];
    addMessage("anotherMsg", "이제 물어봐 주세요.");
  } else if (id === "category" && option !== "음식") {
    addMessage("anotherMsg", "그것은 음식과 매칭이 되나요?");
    addOptions(["돼", "안돼"], "chat");
  } else if (option === "돼" || option === "있어") {
    if (option === "돼") {
      addFoodOption();
    }
    addMessage("anotherMsg", "그것은 어떤음식과 매칭이 되나요?");
  } else if (id === "food") {
    addMessage("anotherMsg", "매칭되는 음식이 더 있나요?");
    addOptions(["있어", "없어"], "chat");
  } else if (option === "없어") {
    toast("감사합니다! 저장했어요.", "success");
    fetchData(optionList, "PUT");
    removeFoodOption();
    optionList = [];
    submit.id = "submit";
    addMessage("anotherMsg", "이제 물어봐 주세요.");
  }
  if (id !== "food") {
    document.getElementById("optionsDiv").remove();
  }
  if (id === "category") {
    document.getElementById("optionsDiv").remove();
  }
}

function chatBotAnswer() {
  let first = [
    "제가 추천하는 음식은 이거에요!",
    "이걸 드셔보는 건 어떠세요?",
    "이건 어떠세요?",
  ];
  let second = [
    "흠.. 그러면 이건 어떠세요?",
    "드디어 이해 했어요! 이걸 드시는건 어때요?",
    "그냥 이거 드셔주실래요?",
  ];
  let third = [
    "너 되게 까다롭구나?",
    "제발 그냥 먹어라",
    "그냥 이거 무조건 먹어라.",
  ];
  var num = Math.floor(Math.random() * 3);

  if (nope === 0) {
    addMessage("anotherMsg", first[num]);
  } else if (nope === 1) {
    addMessage("anotherMsg", second[num]);
  } else if (nope === 2) {
    addMessage("anotherMsg", third[num]);
  } else {
    addMessage("anotherMsg", "아 쫌!!!");
  }
}

function addImg(senderClass, message) {
  setTimeout(() => {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add(senderClass);
    msgDiv.innerHTML = '<span class="msg">' + message + "</span>";
    chatLog.appendChild(msgDiv);
    scrollToBottom();
  }, 1500);
}

function addMessage(senderClass, message) {
  const nameDiv = document.createElement("div");
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(senderClass);
  if (senderClass === "anotherMsg") {
    nameDiv.innerHTML = "<span class='anotherName'>DUNGS</span>";
  } else if (senderClass === "myMsg") {
    nameDiv.innerHTML = "<span class='myName'>ME</span>";
  }
  msgDiv.innerHTML = '<span class="msg"></span>';
  chatLog.appendChild(nameDiv);
  chatLog.appendChild(msgDiv);
  simulateTyping(message, msgDiv.querySelector(".msg"));
  scrollToBottom();
}

function simulateTyping(content, element) {
  let i = 0;
  const typingInterval = 60;
  const typingDelay = 500;

  setTimeout(function () {
    const typing = setInterval(function () {
      if (element && i < content.length) {
        element.textContent += content[i++];
      } else {
        clearInterval(typing);
      }
    }, typingInterval);
  }, typingDelay);
  scrollToBottom();
}

function scrollToBottom() {
  var chatLog = document.getElementById("chatLog");
  chatLog.scrollTop = chatLog.scrollHeight;
}

function handleButtonClick(e) {
  if (optionList.length === 0) {
    send(e);
  } else {
    addFood(e);
  }
}

window.addEventListener("load", () => {
  firstMsg();
  document.getElementById("map").addEventListener("click", () => {
	window.location.href = "view/map.html"
  });
  submit.addEventListener("click", handleButtonClick);
});

// 드롭다운 메뉴 표시하기
const optionListDiv = document.getElementById("optionListDiv");
const dropdown = document.querySelector(".dropdown");

function addFoodOption() {
  setFoodList();
  console.log("addFoodOption() 호출");
  chat.addEventListener("input", filterOptions);
  chat.addEventListener("focus", focusDropdown);
  chat.addEventListener("blur", hideDropdown);
}

function removeFoodOption() {
  console.log("removeFoodOption() 호출");
  chat.removeEventListener("input", filterOptions);
  chat.removeEventListener("focus", focusDropdown);
  chat.removeEventListener("blur", hideDropdown);
  foodList = [];
}

dropdown.addEventListener("mousedown", function (e) {
  e.preventDefault();
});

function showDropdown() {
  dropdown.classList.add("show-dropdown");
}

function hideDropdown() {
  dropdown.classList.remove("show-dropdown");
}

function focusDropdown() {
  if (chat.value.trim() === "") {
    const searchTerm = chat.value.toLowerCase();
    const filteredOptions = foodList.filter((option) =>
      option.toLowerCase().includes(searchTerm)
    );
    updateDropdownOptions(filteredOptions);
  }
  showDropdown();
}

function filterOptions() {
  const searchTerm = chat.value.toLowerCase();
  const filteredOptions = foodList.filter((option) =>
    option.toLowerCase().includes(searchTerm)
  );
  updateDropdownOptions(filteredOptions);
}

function updateDropdownOptions(filteredOptions) {
  // 기존 옵션 목록 삭제
  while (optionListDiv.firstChild) {
    optionListDiv.removeChild(optionListDiv.firstChild);
  }

  // 필터링된 옵션 목록 추가
  filteredOptions.forEach((optionText) => {
    const optionDiv = document.createElement("div");
    optionDiv.textContent = optionText;
    optionDiv.className = "dropdown-item"; // 추가된 부분: 스타일을 적용하기 위해 클래스 추가
    optionDiv.addEventListener("click", function () {
      // 옵션 선택 시 검색창에 값을 넣고 드롭다운 닫기
      chat.value = optionText;
      hideDropdown();
    });
    optionListDiv.appendChild(optionDiv);
  });
}

function toast(text, icon) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  setTimeout(function () {
    Toast.fire({
      icon: icon,
      title: text,
    });
  }, 2000);
}
