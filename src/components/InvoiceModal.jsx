import React, { useState } from "react";
import { useSnackbar } from 'notistack';
import "bootstrap/dist/css/bootstrap.min.css";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import { BiCloudDownload, BiShareAlt } from "react-icons/bi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { uploadToS3 } from "../utils/s3Uploader";

const GenerateInvoice = async (info) => {
  try {
    console.log("Generating invoice...");
    const canvas = await html2canvas(document.querySelector("#invoiceCapture"));
    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [612, 792] });

    pdf.internal.scaleFactor = 1;
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Convert PDF to Blob
    const pdfBlob = pdf.output("blob");
    
    try {
      const fileName = `invoice_${info.invoiceNumber}`;
      // Try to upload to S3, but don't worry if it fails - we'll use local storage
      const fileUrl = await uploadToS3(pdfBlob, fileName);
      console.log("File URL generated:", fileUrl);
      
      // Always create a local download link
      const localUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return fileUrl || localUrl; // Use S3 URL if available, otherwise use local URL
    } catch (error) {
      console.error("Error in file handling:", error);
      // Fallback to local URL if anything goes wrong
      const localUrl = URL.createObjectURL(pdfBlob);
      return localUrl;
    }
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};

const sendInvoiceViaWhatsApp = async (pdfUrl, info, enqueueSnackbar, currency, finalTotal) => {
  try {
    console.log("Sending invoice via WhatsApp with URL:", pdfUrl);
    const token = localStorage.getItem('token'); // Adjusted to match the key used during login
    console.log("Token being sent:", token); // Debugging log
    const response = await fetch("http://localhost:5000/send-whatsapp", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Include the token in the headers
      },
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: info.billToPhone,
        pdfUrl: pdfUrl,
        invoiceNumber: info.invoiceNumber,
        billTo: info.billTo,
        businessName: info.billFrom,
        enterpriseEmail: info.billFromEmail,
        amount: `${currency} ${finalTotal}`
      }),
    });

    const data = await response.json();
    console.log("Response from server:", data); // Debugging log
    if (response.ok) {
      console.log("Invoice sent successfully:", data);

      enqueueSnackbar(`Invoice sent via WhatsApp to ${info.billTo}!`, { 
        variant: 'success',
        autoHideDuration: 3000
      });
      return true;
    } else {
      console.error("Error sending invoice:", data);
      enqueueSnackbar(`Failed to send invoice: ${data.error}`, {
        variant: 'error',
        autoHideDuration: 5000
      });
      return false;
    }
  } catch (error) {
    console.error("Error:", error);
    enqueueSnackbar("Network error while sending the invoice.", { 
      variant: 'error',
      autoHideDuration: 5000
    });
    return false;
  }
};

const InvoiceModal = ({
  showModal,
  closeModal,
  info,
  currency,
  total,
  items,
  discountAmount,
  subTotal,
  cgstRate,
  sgstRate,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const cgstAmount = ((parseFloat(subTotal) || 0) * (parseFloat(cgstRate) || 0) / 100).toFixed(2);
  const sgstAmount = ((parseFloat(subTotal) || 0) * (parseFloat(sgstRate) || 0) / 100).toFixed(2);
  const totalTax = (parseFloat(cgstAmount) || 0) + (parseFloat(sgstAmount) || 0);
  const finalTotal = (parseFloat(total) + totalTax).toFixed(2);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await GenerateInvoice(info);
      enqueueSnackbar('Invoice downloaded successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error generating invoice:', error);
      enqueueSnackbar('Failed to generate invoice', { variant: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const shareInvoice = async () => {
    setIsSending(true);
    try {
      const fileUrl = await GenerateInvoice(info);
      if (!fileUrl) {
        enqueueSnackbar("Failed to generate invoice URL", { variant: 'error' });
        return;
      }

      const success = await sendInvoiceViaWhatsApp(fileUrl, info, enqueueSnackbar, currency, finalTotal);
      if (success) {
        closeModal();
      }
    } catch (error) {
      console.error("Error in shareInvoice:", error);
      enqueueSnackbar("Failed to share invoice", { variant: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal show={showModal} onHide={closeModal} size="lg" centered>
      <div id="invoiceCapture">
        <div className="d-flex flex-row justify-content-between align-items-start bg-light w-100 p-4">
          <div className="w-100">
            <h4 className="fw-bold my-2">
              {info.billFrom || "John Uberbacher"}
            </h4>
            <h6 className="fw-bold text-secondary mb-1">
              Invoice Number: {info.invoiceNumber || ""}
            </h6>
          </div>
          <div className="text-end ms-4">
            <h6 className="fw-bold mt-1 mb-2">Amount Due:</h6>
            <h5 className="fw-bold text-secondary">
              {currency} {finalTotal}
            </h5>
          </div>
        </div>
        <div className="p-4">
          <Row className="mb-4">
            <Col md={4}>
              <div className="fw-bold">Billed From:</div>
              <div>{info.billFrom || ""}</div>
              <div>{info.billFromAddress || ""}</div>
              <div>{info.billFromEmail || ""}</div>
            </Col>
            <Col md={4}>
              <div className="fw-bold">Billed to:</div>
              <div>{info.billTo || ""}</div>
              <div>{info.billToPhone || ""}</div>
              <div>{info.billToEmail || ""}</div>
            </Col>
            <Col md={4}>
              <div className="fw-bold mt-2">Date Of Issue:</div>
              <div>{info.dateOfIssue || ""}</div>
            </Col>
          </Row>
          <Table className="mb-0">
            <thead>
              <tr>
                <th>QTY</th>
                <th>DESCRIPTION</th>
                <th className="text-end">PRICE</th>
                <th className="text-end">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={{ width: "70px" }}>{item.quantity}</td>
                  <td>
                    {item.name} - {item.description}
                  </td>
                  <td className="text-end" style={{ width: "100px" }}>
                    {currency} {item.price}
                  </td>
                  <td className="text-end" style={{ width: "100px" }}>
                    {currency} {(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Table>
            <tbody>
              <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
              <tr className="text-end">
                <td></td>
                <td className="fw-bold" style={{ width: "100px" }}>
                  SUBTOTAL
                </td>
                <td className="text-end" style={{ width: "100px" }}>
                  {currency} {subTotal}
                </td>
              </tr>
              <tr className="text-end">
                <td></td>
                <td className="fw-bold" style={{ width: "100px" }}>
                  CGST
                </td>
                <td className="text-end" style={{ width: "100px" }}>
                  {currency} {cgstAmount || 0}
                </td>
              </tr>
              <tr className="text-end">
                <td></td>
                <td className="fw-bold" style={{ width: "100px" }}>
                  SGST
                </td>
                <td className="text-end" style={{ width: "100px" }}>
                  {currency} {sgstAmount || 0}
                </td>
              </tr>
              {discountAmount !== 0.0 && (
                <tr className="text-end">
                  <td></td>
                  <td className="fw-bold" style={{ width: "100px" }}>
                    DISCOUNT
                  </td>
                  <td className="text-end" style={{ width: "100px" }}>
                    {currency} {discountAmount}
                  </td>
                </tr>
              )}
              <tr className="text-end">
                <td></td>
                <td className="fw-bold" style={{ width: "100px" }}>
                  TOTAL
                </td>
                <td className="text-end" style={{ width: "100px" }}>
                  {currency} {finalTotal}
                </td>
              </tr>
            </tbody>
          </Table>
          {info.notes && (
            <div className="bg-light py-3 px-4 rounded">{info.notes}</div>
          )}
        </div>
      </div>
      <div className="pb-4 px-4">
        <Row>
          <Col md={6}>
            <Button
              variant="outline-primary"
              className="d-block w-100"
              onClick={handleDownload}
              disabled={isGenerating}
            >
              <BiCloudDownload
                style={{ width: "16px", height: "16px", marginTop: "-3px" }}
                className="me-2"
              />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </Col>
          <Col md={6}>
            <Button
              variant="success"
              className="d-block w-100"
              onClick={shareInvoice}
              disabled={isSending}
            >
              <BiShareAlt
                style={{ width: "16px", height: "16px", marginTop: "-3px" }}
                className="me-2"
              />
              {isSending ? 'Sending...' : 'Share via WhatsApp'}
            </Button>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
