if (window.location.href.includes("ok")) {
  alert("account created successfully!");
}





class Input extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="form-group">
        <input 
          name={this.props.name}
          type={this.props.name}
          className="form-control"
          placeholder={this.props.placeholder}
          required="required"
          onChange={this.props.changeHandler}
        >
        </input>
      </div>
    )
  }
}





class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
      emailErr: "",
      passwordErr: ""
    }
    this.changeHandler = this.changeHandler.bind(this);
  }

  changeHandler(event) {
    this.setState({
      value: event.target.value
    });
  }

  render() {
    return (
      <div className="container">
        <p>{this.state.emailErr}</p>
        <p>{this.state.passwordErr}</p>
        <form method="post" action="/v1/auth/register">
          <Input name="email" placeholder="Email" changeHandler={this.changeHandler}/>
          <Input name="password" placeholder="Password"/>
          <button type="submit" className="btn btn-success">LOGIN</button>
        </form>
      </div>
    )
  }
}

ReactDOM.render(
  <Form/>,
  document.getElementById('form')
);