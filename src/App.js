import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import InvoiceForm from './components/InvoiceForm';
import CustomerList from './components/CustomerList';
import ForgotPassword from './components/ForgotPassword';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/invoice" component={InvoiceForm} />
        <Route path="/customers" component={CustomerList} />
        <Redirect from="/" to="/login" />
      </Switch>
    </Router>
  );
};

export default App;