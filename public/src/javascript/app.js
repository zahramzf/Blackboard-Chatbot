// time
function TimeCurrently() {
  const current = new Date();
  const hours = String(current.getHours()).padStart(2, '0');
  const minutes = String(current.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

//profile photo
function showProfilePhoto(photoURL) {
  const imgElement = document.createElement("img");
  imgElement.src = photoURL;
  imgElement.alt = "Profile Photo";
  imgElement.classList.add("profile-photo");
  return imgElement;
}

//feedback 
function setupFeedbackEventListeners() {
  $(".feedback-like").on("click", function() {
    $(this).toggleClass("liked");
    $(".feedback-dislike").removeClass("disliked");
    $(".feedback-window").fadeIn();
  });

  $(".feedback-dislike").on("click", function() {
    $(this).toggleClass("disliked");
    $(".feedback-like").removeClass("liked");
    $(".feedback-window").fadeIn();
  });
}

//feedback close
$(".feedback-close").on("click", function() {
  $(".feedback-window").fadeOut();
});

 //feedback submission
 $(".feedback-submit").on("click", function() {
  const feedbackText = $(".feedback-textarea").val();
});

//form
const submitForm = () => {
  const chatInput = $(".chat-input").val();
  const Timecurrent = TimeCurrently();

  $("main").append(`
  <div class="chat-msg-box clint">
    <p>${chatInput}</p>
    <span class="time">${Timecurrent}</span>
  </div>
  `);

  $.ajax({
    url: `./api/question/?q=${encodeURIComponent(chatInput)}`,
    method: "GET",
    cache: false,
    beforeSend: () => {
      $(".chat-input").val("");
      $(".typing").show();
      $("main").append(`
        <div class="chat-msg-box bot">
          <div class="spinner">
            <div class="bounce1"></div>
            <div class="bounce2"></div>
            <div class="bounce3"></div>
          </div>
        </div>
        `);
      if ($(".chat-msg-box").length >= 10) {
        $([document.documentElement, document.body]).animate({
          scrollTop: $(".chat-msg-box.bot:last-child").offset().top,
        }, { duration: 500 });
      }
    },
    success: (data) => {
      const response = (data.responseText).replace(/\n/gm, "</br>");
      $(".chat-msg-box.bot:last-child").html(`
      <div class="content-container chat-msg-box-inner">
        <p>${response}</p>
        <span class="time2">${Timecurrent}</span>
      </div>
      `);
    },
    error: () => {
      $(".chat-msg-box.bot:last-child").remove();
    },
    complete: () => {
      $(".typing").hide();
    },
  });
};

window.onload = () => {
  setTimeout(() => {
    if (document.querySelectorAll(".chat-msg-box").length == 0) {
      $.ajax({
        url: "./api/welcome",
        beforeSend: () => {
          $(".typing").show();
          $("main").append(`
            <div class="chat-msg-box bot">
              <div class="spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
              </div>
            </div>
            `);
        },
        success: (data) => {
          const response = data.responseText.data;
          const Timecurrent = TimeCurrently();
          console.log(data.responseText);
          
          $(".chat-msg-box.bot:last-child").html(`
          <div>

            <div class="content-container chat-msg-box-inner">
              <div style='font-size: 17px'>
                <h3>${response[0]} <span class="emoji1" style="font-size: 17px;">👋</span> </h3> <br>
                <small>${response[1]} <span class="emoji1" style="font-size: 17px;">🎓📚</span> </small> 
                <small>${response[2]} <span class="emoji1" style="font-size: 17px;">😊</span> </small> <br> <br>
                <small>${response[3]} <span class="emoji1" style="font-size: 17px;">🙌</span> </small> <br><br>
                <small>${response[4]} <span class="emoji1" style="font-size: 17px;">.📝</span> </small> <br><br>
              </div>
              <div class="letsgo">
                <small style='font-size: 16px'>${response[5]} <span class="emoji1" style="font-size: 17px;">💬🚀</span> </small>
                <span class="time">${Timecurrent}</span>
              </div>
          </div>

          <div style='margin-top:7px';>
            <div class="feedback">
              <img src="./src/images/like.png" class="feedback-like" style="width: 19px;height: 18px; margin-right:5px; margin-bottom:2px">
              <img src="./src/images/dislike.png" class="feedback-dislike" style="width: 19px;height: 18px">
            </div>  
          </div>

         </div>
          `) 
          setupFeedbackEventListeners();
        },

        error: () => {
          $(".chat-msg-box.bot:last-child").remove();
        },
        complete: () => {
          $(".typing").hide();
        },
      });
    }
  }, 3000);

  $.ajax({
    url: "./api/allquestions",
    success: (data) => {
      data.forEach((qus) => {
        $(".questions.container").append(`
        <div class="question">
          <p>${qus}</p>
        </div>
        `);
      });
    },
  });
};

const toogleShowSuggestions = () => {
  if ($("main").css("display") == "none") {
    $(".all-questions").hide();
    $("header img").attr("src", "./src/images/chat_icon.png");
    $("main").show();
    $("footer").show();
  } else {
    $(".all-questions").show();
    $("header img").attr("src", "./src/images/close.png");
    $("main").hide();
    $("footer").hide();
  }
};

$("#toogle-chat").on("click", () => {
  toogleShowSuggestions();
});

window.onresize = () => {
  if (window.innerHeight < 580) {
    $("header").css("top", "-4em");
  } else {
    $("header").css("top", "0vh");
  }
};

$("#chat-form").submit((e) => {
  e.preventDefault();
  submitForm();
});

const typed = new Typed(".chat-input", {
  strings: [
    "when is my Artificial intelligent exam?",
  ],
  typeSpeed: 60,
  backSpeed: 30,
  backDelay: 1500,
  showCursor: true,
  cursorChar: "|",
  attr: "placeholder",
  loop: true,
  bindInputFocusEvents: false,
  shuffle: true,
});
