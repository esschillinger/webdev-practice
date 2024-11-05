$(document).ready(() => {
    $('.input__text').each(function() {
        if ($(this).text() == '') $(this).text($(this).data('placeholder'));
    });
});


function reset_cursor(elem, index = 0) {
    let range = document.createRange();
    let sel = window.getSelection();
    range.setStart(elem.childNodes[0], index);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);
    elem.focus();
}


$('.input__text').on('click', function() {
    if (this.dataset.state == 'placeholder') reset_cursor(this);
});


$('.input__text').on('keyup', function(e) {
    if ((e.which == 37 || e.which == 39) && this.dataset.state == 'placeholder') reset_cursor(this);
});


$('.input__text').on('input', function() {
    if (this.dataset.state == 'placeholder') {
        let char = $(this).text().substring(0, 1);
        $(this).text(char);
        reset_cursor(this, 1);
    }

    this.dataset.state = $(this).text() == '' ? 'placeholder' : 'text';

    if (this.dataset.state == 'placeholder') $(this).text($(this).data('placeholder'));
});