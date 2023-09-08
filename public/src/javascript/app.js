/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

// time
function TimeCurrently() {
  const current = new Date();
  const hours = String(current.getHours()).padStart(2, "0");
  const minutes = String(current.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// profile photo
function showProfilePhoto(photoURL) {
  const imgElement = document.createElement("img");
  imgElement.src = photoURL;
  imgElement.alt = "Profile Photo";
  imgElement.classList.add("profile-photo");
  return imgElement;
}

// google function
function sendingEvent(eventdetail) {
  const eventText = `
    The upcoming event is: ${eventdetail.summary}
    Date: ${eventdetail.start.dateTime}
    Location: ${eventdetail.location}
  `;
  response(eventText);
}

// feedback
function setupFeedbackEventListeners() {
  $(".feedback-like").on("click", function () {
    $(this).toggleClass("liked");
    $(".feedback-dislike").removeClass("disliked");
    $(".winfeedback").fadeIn();
  });

  $(".feedback-dislike").on("click", function () {
    $(this).toggleClass("disliked");
    $(".feedback-like").removeClass("liked");
    $(".winfeedback").fadeIn();
  });
}

// feedback close
$(".feedback-close").on("click", () => {
  $(".winfeedback").fadeOut();
});

// feedback submission
$(".submission-feedback").on("click", () => {
  const feedbackText = $(".textsection-feedback").val();
  const postData = {
    text: feedbackText,
  };
  try {
    $.ajax({
      url: "./api/feedBack",
      type: "POST",
      data: postData,
      dataType: "json",
      success(response) {
        console.log("Response from server:", response);
        $(".winfeedback").fadeOut();
      },
      error(xhr, status, error) {
        console.error("Error:", error);
      },
    });
  } catch (error) {
    console.log(error);
  }
});

// form
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
      console.log("data front: ", data);
      if (typeof data.responseText === "object") {
        const response = data.responseText;
        if (response.action == "exam_date") {
          if (response.keyText == "when") {
            $(".chat-msg-box.bot:last-child").html(`
                <div class="content-container chat-msg-box-inner"></br>
                  <p>Perfect, I found it!🤩 Your ${response.summary} is going to be on ${response.time}</p>
                  <small>You can see more details in this google calendar link:<u style="color:rgb(64 101 210);"> ${response.link}</u></small></br>
                  <span class="time2">${Timecurrent}</span>
                </div>
              `);
          } else if (response.keyText == "where"){
            $(".chat-msg-box.bot:last-child").html(`
              <div class="content-container chat-msg-box-inner"></br>
                <p>Perfect, I found it!🤩 Your ${response.summary} is going to be held in ${response.location}</p><br>
                <small>You can see more details in this google calendar link:<u style="color:rgb(64 101 210);"> ${response.link}</u></small></br>
                <span class="time2">${Timecurrent}</span>
              </div>
            `);
          }
        } else if (response.action == "lecture") {
          if (response.keyText == "when") {
            $(".chat-msg-box.bot:last-child").html(`
                <div class="content-container chat-msg-box-inner"></br>
                  <p>Perfect!! Your ${response.summary} lecture held at ${response.time}</p>
                  <small>If you want to see more details please see the google calendar link :<u style="color:rgb(64 101 210);"> ${response.link}</u></small
                  <span class="time2">${Timecurrent}</span>
                </div>
              `);
          } else if (response.keyText == "where") {
            $(".chat-msg-box.bot:last-child").html(`
                <div class="content-container chat-msg-box-inner"></br>
                  <p>Your ${response.summary} lecture held in ${response.location}</p>
                  <small>If you want to see more details please see the google calendar link :<u style="color:blue;"> ${response.link}</u></small
                  <span class="time2">${Timecurrent}</span>
                </div>
              `);
          }
        } else if (response.action == "read_PDF") {
          try {
            if (response.keyText == "who") {
              $(".chat-msg-box.bot:last-child").html(`
                <div class="content-container chat-msg-box-inner"></br>
                  <p style="margin-bottom : .5rem;">${response.description} who's teaching this course!</p>
                  <small>If you want to see more details please download the file by pressing on the link : <a href="../../documents/${response.course}.pdf" class="download_btn" style="color:blue;" id="download.${response.course}" download: '../../documents/${response.course}.pdf'> Download</a></small></br>
                  <span class="time2">${Timecurrent}</span>
                </div>
              `);
            } else if (response.keyText == "what") {
              $(".chat-msg-box.bot:last-child").html(`
                <div class="content-container chat-msg-box-inner"></br>
                  <p>${response.description.join("+")}</p></br>
                  <small>If you want to see more details please download the file by pressing on the link: <a href="../../documents/${response.course}.pdf" class="download_btn" style="color:rgb(64 101 210);" id="download.${response.course}" download: '../../documents/${response.course}.pdf'> Download The Document</a></small></br>
                  <span class="time2">${Timecurrent}</span>
                </div>
              `);
            } else if (response.keyText == "when") {
              $(".chat-msg-box.bot:last-child").html(`
                <div class="content-container chat-msg-box-inner"></br>
                  <p>${response.description.trim("\n")}</p>
                  <small>If you want to see more details please download the file by pressing on the link : <a href="../../documents/${response.course}.pdf" class="download_btn" style="color:blue;" id="download.${response.course}" download: '../../documents/${response.course}.pdf'> Download</a></small></br>
                  <span class="time2">${Timecurrent}</span>
                </div>
              `);
            }
          } catch (error) {
            console.log(error);
          }
        }
      } else {
        const response = (data.responseText).replace(/\n/gm, "</br>");
        $(".chat-msg-box.bot:last-child").html(`
        <div class="content-container chat-msg-box-inner">
          <p>${response}</p>
          <span class="time2">${Timecurrent}</span>
        </div>
        `);
      }
    },
    error: () => {
      $(".chat-msg-box.bot:last-child").remove();
    },
    complete: () => {
      $(".typing").hide();
    },
  });
};

function downloadFile(course) {
  const postData = {
    course,
  };
  try {
    $.ajax({
      url: "./api/download",
      type: "GET",
      data: postData,
      dataType: "json",
      success(response) {
        console.log("Response from server:", response);
      },
      error(xhr, status, error) {
        console.error("Error:", error);
      },
    });
  } catch (error) {
    console.log(error);
  }
}

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
          `);
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
