function reflectState() {
  const state = Cookies.getJSON('state');
  console.log(JSON.stringify(state, null, 4));
}

function saveState() {
  const state = {
    array: [
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a' ]
    ],
    desired: 'b',
    correct: 0,
    incorrect: 0
  };

  // Determine the values in `array`.
  const toggles = $('tr.toggles');
  for (let row = 0; row < toggles.length; row++) {
    const buttons = $(toggles[row]).find('a');
    for (let col = 0; col < buttons.length; col++) {
      state.array[row][col] = ($(buttons[col]).hasClass('ui-btn-b') ? 'b' : 'a');
    }
  }

  // Determine `desired`.
  state.desired = $('#desired').hasClass('ui-btn-b') ? 'b' : 'a';

  // Determine `correct`.
  state.correct = +$('#correct').text();

  // Determine `incorrect`.
  state.incorrect = +$('#incorrect').text();

  console.log('state: ' + JSON.stringify(state, null, 4));

  Cookies.set('state', state);
}

$(document).on('ready', function() {

reflectState();

$('.toggle').add('#desired').on('click', function() {
  $(this).toggleClass('ui-btn-b');
  saveState();
});

$('.counter').on('click', function() {
  const btn = $(this);
  btn.text(+btn.text() + 1);
  if (btn.attr('id') === 'correct') {
    money = $("#money");
    money.text(+money.text() + 1);
  }
  saveState();
});

});
