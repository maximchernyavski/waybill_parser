import React, { useState, useEffect } from 'react';
import { 
  Layout,
  Steps, 
  message,
} from 'antd';

import SelectDocument from './slides/select_documents';
import PreviewBlock from './slides/preview_document';
import ExportBlock from './slides/export_document';

import HistoryModal from './slides/history_modal';

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

    console.log("Data received ===>", data)

    setApiData(data || mockData);
    setCurrent(1);
    message.success('Документ успешно обработан');
  };

  const generateXML = (data) => {
    const { document_header, items, totals } = data;
    const isAct = !!document_header.contractor_info;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += isAct ? '<Act>\n' : '<Waybill>\n';
    
    // Header
    xml += '  <Header>\n';
    xml += `    <DocumentNumber>${document_header.document_number || ''}</DocumentNumber>\n`;
    xml += `    <DocumentDate>${document_header.document_date || ''}</DocumentDate>\n`;
    
    if (isAct) {
      xml += `    <Contract>${document_header.contract_info || ''}</Contract>\n`;
      xml += `    <Contractor>\n`;
      xml += `      <Name>${document_header.contractor_info?.name || ''}</Name>\n`;
      xml += `      <UNP>${document_header.contractor_info?.unp || ''}</UNP>\n`;
      xml += `    </Contractor>\n`;
      xml += `    <Customer>\n`;
      xml += `      <Name>${document_header.customer_info?.name || ''}</Name>\n`;
      xml += `      <UNP>${document_header.customer_info?.unp || ''}</UNP>\n`;
      xml += `    </Customer>\n`;
    } else {
      xml += `    <Sender>\n`;
      xml += `      <Name>${document_header.sender_info?.name || ''}</Name>\n`;
      xml += `      <UNP>${document_header.sender_info?.unp || ''}</UNP>\n`;
      xml += `    </Sender>\n`;
      xml += `    <Receiver>\n`;
      xml += `      <Name>${document_header.receiver_info?.name || ''}</Name>\n`;
      xml += `      <UNP>${document_header.receiver_info?.unp || ''}</UNP>\n`;
      xml += `    </Receiver>\n`;
    }
    
    xml += '  </Header>\n';

    // Items
    xml += '  <Items>\n';
    if (Array.isArray(items)) {
      items.forEach(item => {
        xml += '    <Item>\n';
        xml += `      <RowNumber>${item.row_number || ''}</RowNumber>\n`;
        if (isAct) {
          xml += `      <ServiceCode>${item.service_code || ''}</ServiceCode>\n`;
        }
        xml += `      <Name>${item.name || ''}</Name>\n`;
        if (!isAct) {
          xml += `      <Description>${item.description || ''}</Description>\n`;
        }
        xml += `      <Unit>${item.unit || ''}</Unit>\n`;
        xml += `      <Quantity>${item.quantity || 0}</Quantity>\n`;
        xml += `      <Price>${item.price_per_unit || 0}</Price>\n`;
        xml += `      <CostWithoutVat>${item.cost_without_vat || 0}</CostWithoutVat>\n`;
        xml += `      <VatRate>${isAct ? (item.vat_rate || '') : (item.vat_rate_percent || 0)}</VatRate>\n`;
        xml += `      <VatAmount>${item.vat_amount || 0}</VatAmount>\n`;
        xml += `      <CostWithVat>${item.cost_with_vat || 0}</CostWithVat>\n`;
        
        if (!isAct) {
          xml += `      <Packages>${item.packages_count || 0}</Packages>\n`;
          xml += `      <Mass>${item.mass_tonnes || 0}</Mass>\n`;
          xml += `      <Note>${item.note || ''}</Note>\n`;
        }
        
        xml += '    </Item>\n';
      });
    }
    xml += '  </Items>\n';

    // Totals
    if (totals) {
      xml += '  <Totals>\n';
      if (!isAct) {
        xml += `    <TotalQuantity>${totals.total_quantity || 0}</TotalQuantity>\n`;
        xml += `    <TotalPackages>${totals.total_packages || 0}</TotalPackages>\n`;
        xml += `    <TotalMass>${totals.total_mass_tonnes || 0}</TotalMass>\n`;
      }
      xml += `    <TotalCostNoVat>${totals.total_cost_without_vat || 0}</TotalCostNoVat>\n`;
      xml += `    <TotalVat>${totals.total_vat_amount || 0}</TotalVat>\n`;
      xml += `    <TotalCostWithVat>${totals.total_cost_with_vat || 0}</TotalCostWithVat>\n`;
      xml += '  </Totals>\n';
    }

    xml += isAct ? '</Act>' : '</Waybill>';
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
    { title: 'Выберите документы', disabled: false },
    { title: 'Предпросмотр', disabled: !apiData },
    { title: 'Экспорт', disabled: !apiData }
  ];

  // 2. CREATE A RENDER FUNCTION
  // This ensures PreviewBlock always gets the FRESH apiData from state
  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <SelectDocument 
            files={files} 
            setFiles={setFiles} 
            onProcess={handleProcessComplete} 
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        );
      case 1:
        return (
          <PreviewBlock 
            data={apiData} 
            setData={setApiData} 
          />
        );
      case 2:
        return (
          <ExportBlock 
            onExport={handleExport} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider width={260} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Logo />
          <div style={{ flex: 1, padding: '30px 20px', opacity: isProcessing ? 0.5 : 1, transition: 'opacity 0.3s' }}>
            <Steps
              direction="vertical"
              current={current}
              onChange={handleStepChange}
            >
              {steps.map((s, i) => (
                <Step 
                  key={s.title} 
                  title={s.title} 
                  disabled={s.disabled}
                  style={{ cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                />
              ))}
            </Steps>
          </div>
          <div style={{ padding: '20px', background: BRAND_COLOR, marginTop: 'auto' }}>
             <HistoryModal />
          </div>
        </div>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', height: '64px' }} />
        
        <Content style={{ padding: '24px', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          {/* 3. CALL THE RENDER FUNCTION HERE */}
          {renderStepContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default WaybillParser;
