import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import Login from './components/Login';
import Register from './components/Register';
import InvoiceForm from './components/InvoiceForm';
import CustomerList from './components/CustomerList';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';

// Protected Route Component
const ProtectedRoute = ({ component: Component, ...rest }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  return (
    <Route
      {...rest}
      render={props =>
        isLoggedIn ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ component: Component, restricted, ...rest }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  return (
    <Route
      {...rest}
      render={props =>
        isLoggedIn && restricted ? (
          <Redirect to="/dashboard" />
        ) : (
          <Component {...props} />
        )
      }
    />
  );
};

const App = () => {
  return (
    <SnackbarProvider maxSnack={3}>
      <Router>
        <Switch>
          {/* Public Routes */}
          <PublicRoute restricted={true} path="/login" component={Login} />
          <PublicRoute restricted={true} path="/register" component={Register} />
          <PublicRoute restricted={true} path="/forgot-password" component={ForgotPassword} />

          {/* Protected Routes */}
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/invoice" component={InvoiceForm} />
          <ProtectedRoute path="/customers" component={CustomerList} />

          {/* Default Routes */}
          <Route exact path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="*">
            <Redirect to="/dashboard" />
          </Route>
        </Switch>
      </Router>
    </SnackbarProvider>
  );
};

export default App;