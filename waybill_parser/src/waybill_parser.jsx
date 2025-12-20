import React, { useState, useEffect } from 'react';
import { 
  Layout,
  Steps, 
  message,
} from 'antd';

import SelectDocument from './slides/select_documents';
import PreviewBlock from './slides/preview_document';
import ExportBlock from './slides/export_document';

const { Header, Content, Sider } = Layout;
const { Step } = Steps;

// --- Constants ---
const BRAND_COLOR = '#830e0e';

// --- Components ---

const Logo = () => (
  <div style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BRAND_COLOR, color: 'white', padding: '10px' }}>
    <div style={{ fontSize: '48px', fontWeight: 'bold', lineHeight: '1' }}>WP</div>
    <div style={{ fontSize: '10px', marginTop: '5px', letterSpacing: '1px' }}>WAYBILL PARSER</div>
  </div>
);

// --- MAIN APP ---
const WaybillParser = () => {
  const [current, setCurrent] = useState(0);
  const [files, setFiles] = useState([]);
  const [apiData, setApiData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (files.length === 0) {
      setApiData(null); 
      setCurrent(0);    
    }
  }, [files]);

  // Mocking the NEW JSON Structure with "name" field
  const handleProcessComplete = (data) => {
    const mockData = {
      processing_metadata: {
        has_attachment: true,
        attachment_page_count: 2
      },
      document_header: {
        document_number: "",
        document_date: "",
        total_amount_with_vat: 0.0,
        sender_info: {
          name: "",
          unp: ""
        },
        receiver_info: {
          name: "",
          unp: ""
        }
      },
      items: [
        {
          row_number: "",
          description: "",
          name: "", // Cleaned Name
          unit: "",
          quantity: 0,
          price_per_unit: 0,
          cost_without_vat: 0,
          vat_rate_percent: 0,
          vat_amount: 0,
          cost_with_vat: 0,
          packages_count: 0,
          mass_tonnes: 0,
          note: ""
        }
      ],
      totals: {
        total_quantity: 0,
        total_cost_without_vat: 0,
        total_vat_amount: 0,
        total_cost_with_vat: 0,
        total_packages: 0,
        total_mass_tonnes: 0
      }
    };

    setApiData(data || mockData);
    setCurrent(1);
    message.success('Документ успешно обработан');
  };

  const generateXML = (data) => {
    const { document_header, items, totals } = data;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Waybill>\n';
    
    // Header
    xml += '  <Header>\n';
    xml += `    <DocumentNumber>${document_header.document_number}</DocumentNumber>\n`;
    xml += `    <DocumentDate>${document_header.document_date}</DocumentDate>\n`;
    xml += `    <Sender>\n`;
    xml += `      <Name>${document_header.sender_info?.name || ''}</Name>\n`;
    xml += `      <UNP>${document_header.sender_info?.unp || ''}</UNP>\n`;
    xml += `    </Sender>\n`;
    xml += `    <Receiver>\n`;
    xml += `      <Name>${document_header.receiver_info?.name || ''}</Name>\n`;
    xml += `      <UNP>${document_header.receiver_info?.unp || ''}</UNP>\n`;
    xml += `    </Receiver>\n`;
    xml += `    <TotalAmount>${document_header.total_amount_with_vat}</TotalAmount>\n`;
    xml += '  </Header>\n';

    // Items
    xml += '  <Items>\n';
    if (Array.isArray(items)) {
      items.forEach(item => {
        xml += '    <Item>\n';
        xml += `      <RowNumber>${item.row_number}</RowNumber>\n`;
        xml += `      <Name>${item.name}</Name>\n`; // Updated to use cleaned name
        xml += `      <Description>${item.description}</Description>\n`; // Preserving raw description
        xml += `      <Unit>${item.unit}</Unit>\n`;
        xml += `      <Quantity>${item.quantity}</Quantity>\n`;
        xml += `      <Price>${item.price_per_unit}</Price>\n`;
        xml += `      <CostWithoutVat>${item.cost_without_vat}</CostWithoutVat>\n`;
        xml += `      <VatRate>${item.vat_rate_percent}</VatRate>\n`;
        xml += `      <VatAmount>${item.vat_amount}</VatAmount>\n`;
        xml += `      <CostWithVat>${item.cost_with_vat}</CostWithVat>\n`;
        xml += `      <Packages>${item.packages_count}</Packages>\n`;
        xml += `      <Mass>${item.mass_tonnes}</Mass>\n`;
        xml += `      <Note>${item.note}</Note>\n`;
        xml += '    </Item>\n';
      });
    }
    xml += '  </Items>\n';

    // Totals
    if (totals) {
      xml += '  <Totals>\n';
      xml += `    <TotalQuantity>${totals.total_quantity}</TotalQuantity>\n`;
      xml += `    <TotalCostNoVat>${totals.total_cost_without_vat}</TotalCostNoVat>\n`;
      xml += `    <TotalVat>${totals.total_vat_amount}</TotalVat>\n`;
      xml += `    <TotalCostWithVat>${totals.total_cost_with_vat}</TotalCostWithVat>\n`;
      xml += `    <TotalPackages>${totals.total_packages}</TotalPackages>\n`;
      xml += `    <TotalMass>${totals.total_mass_tonnes}</TotalMass>\n`;
      xml += '  </Totals>\n';
    }

    xml += '</Waybill>';
    return xml;
  };

  const handleExport = () => {
    if (!apiData) return;

    try {
      const xmlString = generateXML(apiData);
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `waybill_${apiData.document_header?.document_number || 'export'}.xml`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('XML файл успешно сформирован и скачан');
    } catch (e) {
      console.error(e);
      message.error('Ошибка при создании файла экспорта');
    }
  };

  const handleStepChange = (targetStep) => {
    if (isProcessing) return;
    if (targetStep < current || apiData) {
      setCurrent(targetStep);
    }
  };

  const steps = [
    { 
      title: 'Выберите документы', 
      content: <SelectDocument 
                 files={files} 
                 setFiles={setFiles} 
                 onProcess={handleProcessComplete} 
                 isProcessing={isProcessing}
                 setIsProcessing={setIsProcessing}
               /> 
    },
    { title: 'Предпросмотр', content: <PreviewBlock data={apiData} setData={setApiData} /> },
    { title: 'Экспорт', content: <ExportBlock onExport={handleExport} /> }
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider width={260} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <Logo />
        <div style={{ padding: '30px 20px', opacity: isProcessing ? 0.5 : 1, transition: 'opacity 0.3s' }}>
          <Steps
            direction="vertical"
            current={current}
            onChange={handleStepChange}
          >
            {steps.map((s, i) => (
              <Step 
                key={s.title} 
                title={s.title} 
                disabled={i > 0 && !apiData} 
                style={{ cursor: isProcessing ? 'not-allowed' : 'pointer' }}
              />
            ))}
          </Steps>
        </div>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', height: '64px' }} />
        
        <Content style={{ padding: '24px', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          {steps[current].content}
        </Content>
      </Layout>
    </Layout>
  );
};

export default WaybillParser;
