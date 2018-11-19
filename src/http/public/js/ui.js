$(document).ready(function () {

    var txt = document.getElementById("code");

    var code_mirror = CodeMirror.fromTextArea(txt, {
        value: "123;",
        mode: "javascript",
        theme: "monokai",
        lineNumbers: true,
        gutter: true
    });

    var welcome_message = [
        "//",
        "// Welcome to Construct!",
        "//",
        "// Overwrite the contents of this textbox with the code you wish to analyse.",
        "//",
        "",
        "",
        "",
        "",
        "",
        ""
    ];

    code_mirror.setValue(welcome_message.join("\n"));

    $("#code-form").submit(function (e) {

        e.preventDefault();

        var $form = $(this),
            url  = $form.attr("action");

        $.ajax({
            type: "POST",
            url: url,
            data: $form.serialize(),
            success: function (data) {
                $("#output").text(JSON.stringify(data, null, 2));
            }
        });
    });
});
