import React, { useState } from 'react';
import { Modal, Button, Upload, notification, message, Typography } from 'antd';
import { FileSearchOutlined, UploadOutlined } from '@ant-design/icons';
import PreviewBlock from './preview_document';

const { Title } = Typography;

const HistoryModal = () => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);

  const showModal = () => setVisible(true);
  
  const handleClose = () => {
    setVisible(false);
    setData(null);
  };

  const parseXML = (xmlString) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "application/xml");
      
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("Invalid XML formatting");
      }

      const getVal = (node, tag) => {
        const el = node.getElementsByTagName(tag)[0];
        return el ? el.textContent : '';
      };

      const isAct = xmlDoc.getElementsByTagName("Act").length > 0;
      const root = isAct ? xmlDoc.getElementsByTagName("Act")[0] : xmlDoc.getElementsByTagName("Waybill")[0];
      const headerNode = root.getElementsByTagName("Header")[0];
      const itemsList = root.getElementsByTagName("Item");
      const totalsNode = root.getElementsByTagName("Totals")[0];

      const document_header = {
        document_number: getVal(headerNode, "DocumentNumber"),
        document_date: getVal(headerNode, "DocumentDate"),
      };

      if (isAct) {
        document_header.contract_info = getVal(headerNode, "Contract");
        const contractorNode = headerNode.getElementsByTagName("Contractor")[0];
        const customerNode = headerNode.getElementsByTagName("Customer")[0];

        if (contractorNode) {
          document_header.contractor_info = {
            name: getVal(contractorNode, "Name"),
            unp: getVal(contractorNode, "UNP"),
          };
        }
        if (customerNode) {
          document_header.customer_info = {
            name: getVal(customerNode, "Name"),
            unp: getVal(customerNode, "UNP"),
          };
        }
      } else {
        const senderNode = headerNode.getElementsByTagName("Sender")[0];
        const receiverNode = headerNode.getElementsByTagName("Receiver")[0];

        if (senderNode) {
          document_header.sender_info = {
            name: getVal(senderNode, "Name"),
            unp: getVal(senderNode, "UNP"),
          };
        }
        if (receiverNode) {
          document_header.receiver_info = {
            name: getVal(receiverNode, "Name"),
            unp: getVal(receiverNode, "UNP"),
          };
        }
      }

      const items = Array.from(itemsList).map(itemNode => {
        const itemObj = {
          row_number: getVal(itemNode, "RowNumber"),
          name: getVal(itemNode, "Name"),
          unit: getVal(itemNode, "Unit"),
          quantity: parseFloat(getVal(itemNode, "Quantity")) || 0,
          price_per_unit: parseFloat(getVal(itemNode, "Price")) || 0,
          cost_without_vat: parseFloat(getVal(itemNode, "CostWithoutVat")) || 0,
          vat_amount: parseFloat(getVal(itemNode, "VatAmount")) || 0,
          cost_with_vat: parseFloat(getVal(itemNode, "CostWithVat")) || 0,
        };

        if (isAct) {
          itemObj.service_code = getVal(itemNode, "ServiceCode");
          itemObj.vat_rate = getVal(itemNode, "VatRate");
        } else {
          itemObj.description = getVal(itemNode, "Description");
          itemObj.vat_rate_percent = parseFloat(getVal(itemNode, "VatRate")) || 0;
          itemObj.packages_count = parseFloat(getVal(itemNode, "Packages")) || 0;
          itemObj.mass_tonnes = parseFloat(getVal(itemNode, "Mass")) || 0;
          itemObj.note = getVal(itemNode, "Note");
        }
        return itemObj;
      });

      const totals = {};
      if (totalsNode) {
        totals.total_cost_without_vat = parseFloat(getVal(totalsNode, "TotalCostNoVat")) || 0;
        totals.total_vat_amount = parseFloat(getVal(totalsNode, "TotalVat")) || 0;
        totals.total_cost_with_vat = parseFloat(getVal(totalsNode, "TotalCostWithVat")) || 0;
        
        if (!isAct) {
          totals.total_quantity = parseFloat(getVal(totalsNode, "TotalQuantity")) || 0;
          totals.total_packages = parseFloat(getVal(totalsNode, "TotalPackages")) || 0;
          totals.total_mass_tonnes = parseFloat(getVal(totalsNode, "TotalMass")) || 0;
        }
      }

      return { document_header, items, totals };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to parse XML file.');
    }
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let parsedData = null;

        if (file.type === "application/json" || file.name.endsWith(".json")) {
          parsedData = JSON.parse(content);
        } else if (file.type === "text/xml" || file.type === "application/xml" || file.name.endsWith(".xml")) {
          parsedData = parseXML(content);
        } else {
          message.error("Unsupported file format. Please upload JSON or XML.");
          return;
        }
        
        setData(parsedData);
        message.success(`${file.name} успешно загружен!`);
      } catch (err) {
        message.error(`Ошибка при чтении файла: ${err.message}`);
      }
    };

    reader.readAsText(file);
    return false; // Prevent default upload behavior
  };

  return (
    <>
      <Button 
        type="default" 
        icon={<FileSearchOutlined />} 
        onClick={showModal} 
        style={{ width: '100%', marginTop: 'auto', textAlign: 'left', background: 'transparent', color: '#fff', border: '1px solid #fff' }}
      >
        Быстрый просмотр
      </Button>

      <Modal
        title={<Title level={4}>Просмотр загруженных файлов</Title>}
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={1400}
        style={{ top: 20 }}
        styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
      >
        <Upload
          accept=".json,.xml"
          beforeUpload={handleFileUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} style={{ marginBottom: 20 }}>
            Загрузить JSON / XML для предпросмотра
          </Button>
        </Upload>

        {data ? (
          <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
             <PreviewBlock data={data} setData={setData} />
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            Пожалуйста загрузите файл XML или JSON
          </div>
        )}
      </Modal>
    </>
  );
};

export default HistoryModal;
