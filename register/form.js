'use strict';

const e = React.createElement;

class Form extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return e('div', {className: 'container'},
      e('form', {}, 
        e('div', { className: 'form-group' }, 
          e('input', {
            type: 'email',
            className: 'form-control',
            placeholder: 'Email',
            required: 'required'
          })
        ),
        e('div', { className: 'form-group' },
          e('input', {
            type: 'password',
            className: 'form-control',
            placeholder: 'Password',
            required: 'required'
          })
        ),
        e('button', {
          type: 'submit',
          className: 'btn btn-success',
        }, 'LOGIN')
      )
    )
  }
}

const domContainer = document.querySelector('#form');
ReactDOM.render(e(Form), domContainer);