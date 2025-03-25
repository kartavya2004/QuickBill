import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Container from "react-bootstrap/Container";
import InvoiceForm from "./components/InvoiceForm";
import React from 'react';
import { SnackbarProvider } from 'notistack'; // Import SnackbarProvider
import InvoiceModal from './components/InvoiceModal'; // Ensure this is correctly imported if used

const App = () => {
  return (
    <SnackbarProvider maxSnack={3}> {/* Wrap your application with SnackbarProvider */}
      <div className="App d-flex flex-column align-items-center justify-content-center w-100">
        <Container>
          <InvoiceForm />
        </Container>
      </div>
    </SnackbarProvider>
  );
};

export default App;
