function uid() {
    return localStorage.uid || (localStorage.uid = crypto.randomUUID());
  }
  
  function log(activity) {
    activity.userId = uid();
    $.ajax({
      url: "/api/log",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(activity)
    });
  }
  
  $("#startBtn").on("click", () => {
    log({type: "page_enter", page: "home"});
    window.location = "/learn/1";
  });

  if (typeof LESSON_ID !== "undefined") {
    $.getJSON(`/api/lesson/${LESSON_ID}`, data => {
      $("#lessonTitle").text(data.title);
      $("#lessonBody").html(data.html);
      $("#lessonImg").attr("src", data.img);
      log({type:"lesson_view", page:"lesson", lessonId: LESSON_ID});
  
      $("#nextLesson").on("click", () => {
        const next = LESSON_ID + 1;
        $.get(`/api/lesson/${next}`).done(()=>window.location=`/learn/${next}`)
          .fail(()=>window.location="/quiz/1");
      });
    });
  }

  if (typeof QUIZ_ID !== "undefined") {
    $.getJSON(`/api/quiz/${QUIZ_ID}`, q => {
      $("#quizQ").text(q.question);
      q.options.forEach(opt => {
        $("#options").append(
          `<label class="list-group-item">
             <input class="form-check-input me-2" type="radio" name="opt" value="${opt}">${opt}
           </label>`);
      });
  
      $("input[name=opt]").on("change", ()=>$("#submitAns").prop("disabled", false));
  
      $("#submitAns").on("click", () => {
        const pick = $("input[name=opt]:checked").val();
        const correct = pick === q.answer;
        log({type:"quiz_answer", page:"quiz", questionId:q.id,
             selectedAnswer:pick, isCorrect:correct});
        const next = QUIZ_ID + 1;
        $.get(`/api/quiz/${next}`).done(()=>window.location=`/quiz/${next}`)
          .fail(()=>window.location="/result");
      });
    });
  }
  
  if ($("#scoreLine").length) {
    $.getJSON(`/api/result/${uid()}`, res => {
      $("#scoreLine").text(`You scored ${res.score} out of ${res.total}`);
    });
  }
  