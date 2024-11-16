let address_book = new Map();


$(document).ready(() => {
    $('.custom-input__text').each(function() {
        if ($(this).text() == '') $(this).text($(this).data('placeholder'));
    });

    $('.custom-input__user-info').each(function() { address_book.set($(this).find('.custom-input__user-handle').text(), $(this).find('.custom-input__user-name').text()); });
});


function set_cursor(elem, start = 0) {
    let range = document.createRange();
    let sel = window.getSelection();
    range.setStart(elem.childNodes[0], start);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);
    elem.focus();
}


function make_selection(elem) {
    console.log('select');
    let range = document.createRange();
    let sel = window.getSelection();
    range.selectNodeContents(elem);
    sel.removeAllRanges();
    sel.addRange(range);

    console.log($(':focus'));
    
    elem.focus();
}


function validate_username(username) {
    for (const handle of address_book.keys()) {
        if (username == handle) {
            // $('.custom-input__collaborator').text(address_book.get(handle));
            $('.custom-input__collaborator').addClass('handle-validated');
            $('.custom-input__collaborator').get(0).dataset.handle = handle;

            return;
        }
    }

    $('.custom-input__collaborator').contents().unwrap();
}


$('.custom-input__text').on('click', function() {
    if (this.dataset.state == 'placeholder') set_cursor(this);

}).on('keyup', function(e) {
    // using arrow keys while there's no text in the div "input" (don't want user to be able to move through "placeholder")
    if ((e.which == 37 || e.which == 39) && this.dataset.state == 'placeholder') set_cursor(this);

    // tabbing to a username span should focus it and select all inner text
    if (e.which == 9) {
        let username = $(this).find('.custom-input__collaborator');
        if (username.length && username.is(':focus')) make_selection(username.get(0));
    }
    
}).on('input', function(e) {
    if (this.dataset.state == 'placeholder') {
        let char = $(this).text().substring(0, 1);
        $(this).text(char);
        set_cursor(this, 1, 1);
    }

    this.dataset.state = $(this).text() == '' ? 'placeholder' : 'text';

    if (this.dataset.state == 'placeholder') $(this).text($(this).data('placeholder'));

    // filter "datalist" if user is typing in a span
    let collaborator = $('.custom-input__collaborator');
    if (collaborator.length) {
        if (collaborator.is(':focus')) {
            // filter "datalist" with the search results
    
            $('.custom-input__user-handle').each(function() {
                let input_user = $(this).closest('.custom-input__user');
    
                if ($(this).text().includes(collaborator.text().substring(1))) input_user.show();
                else input_user.hide();
            });
        }
    } else {
        // if (collaborator.text() == '') {
        $('.custom-input__address-book').addClass('scale-zero');
        $('.custom-input__text').focus();
        // }

        if (e.originalEvent.data == '@') {
            // add span and show "datalist"

            let text = $(this).text();
    
            let start_index = text.indexOf('@');
            let preamble = text.substring(0, start_index);
            let closing_remarks = text.substring(start_index + 1);

            $(this).html(`${preamble}<span class="custom-input__collaborator" tabindex="0">@</span> ${closing_remarks}`);
            set_cursor($('.custom-input__collaborator').get(0), 1, 1); // will focus the element as well
        }
    }
});


$(document).on('mousedown', '.custom-input__collaborator', function() {
    make_selection(this);
    
}).on('mouseup', (e) => {
    e.preventDefault();

}).on('focus', '.custom-input__collaborator', function() {
    $('.custom-input__address-book').removeClass('scale-zero');

}).on('blur', '.custom-input__collaborator', function() {
    $('.custom-input__address-book').addClass('scale-zero');
    $('.custom-input__user').show();
    validate_username($(this).text().substring(1));
});


$('.custom-input__address-book > .custom-input__user').on('mousedown', function() {
    let collaborator = $('.custom-input__collaborator');
    
    collaborator.text('@' + $(this).find('.custom-input__user-handle').text());
    collaborator.addClass('handle-validated');
});


$('.icon-wrapper:has(.custom-input__send)').on('click', () => {
    validate_username($('.custom-input__collaborator').text().substring(1));
    if ($('.custom-input__collaborator').length) window.alert('Send to server: ' + $('.custom-input__collaborator').get(0).dataset.handle);
    else window.alert('No valid username present');
});