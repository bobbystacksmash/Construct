$(document).ready(function () {

    var txt = document.getElementById("code");

    var code_mirror = CodeMirror.fromTextArea(txt, {
        mode: "javascript",
        theme: "monokai",
        lineNumbers: true,
        gutter: true
    });
    code_mirror.setSize(null, "500px");

    var results_mirror = CodeMirror.fromTextArea(document.getElementById("scan-results"), {
        mode: "javascript",
        theme: "monokai"
    });
    results_mirror.setSize(null, "500px");

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
                console.log("GOT RESULT", data);
                results_mirror.setValue(JSON.stringify(data, null, 2));
            },
            fail: function () {
                alert("ERROR!");
            }
        });
    });

    $("#btn-code-tidy").on("click", function (e) {

        var code = code_mirror.getValue(),
            tidy = window.js_beautify(code);

        code_mirror.setValue(tidy);
    });
});
