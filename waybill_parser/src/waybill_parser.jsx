import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Button, 
  Upload, 
  List, 
  Typography, 
  Input, 
  Table, 
  Steps, 
  message, 
  notification, // Import notification
  Card,
  Row,
  Col,
  Divider,
  Spin
} from 'antd';
import { 
  InboxOutlined, 
  DeleteOutlined, 
  FileTextOutlined, 
  ExportOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { Dragger } = Upload;
const { Title, Text } = Typography;
const { Step } = Steps;

// --- Constants ---
const BRAND_COLOR = '#830e0e';
const API_URL = 'http://localhost:8080/process-document'; // Will fail in demo environment

// --- Components ---

const Logo = () => (
  <div style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BRAND_COLOR, color: 'white', padding: '10px' }}>
    <div style={{ fontSize: '48px', fontWeight: 'bold', lineHeight: '1' }}>WP</div>
    <div style={{ fontSize: '10px', marginTop: '5px', letterSpacing: '1px' }}>WAYBILL PARSER</div>
  </div>
);

// 1. SELECT DOCUMENT BLOCK 
const SelectDocument = ({ files, setFiles, onProcess, isProcessing, setIsProcessing }) => {
  const [api, contextHolder] = notification.useNotification(); 

  const handleRemove = (file) => {
    setFiles((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  const props = {
    name: 'file',
    multiple: true,
    fileList: files,
    disabled: isProcessing,
    beforeUpload: (file) => {
      setFiles((prev) => [...prev, file]); 
      return false;
    },
    onRemove: handleRemove,
  };

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      onProcess(data);

    } catch (error) {
      console.error("Processing failed:", error);
      
      api.error({
        message: 'Ошибка подключения',
        description: 'Server is down. Please try again later.',
        placement: 'topRight',
        duration: 4,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', height: '100%' }}>
      {contextHolder}
      
      <Title level={4}>Выберите документы для обработки</Title>
      
      <Dragger 
        {...props} 
        style={{ 
          padding: 40, 
          background: isProcessing ? '#f5f5f5' : '#fff', 
          borderRadius: '8px', 
          marginBottom: 20,
          cursor: isProcessing ? 'not-allowed' : 'pointer'
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: isProcessing ? '#ccc' : BRAND_COLOR }} />
        </p>
        <p className="ant-upload-text" style={{ color: isProcessing ? '#999' : undefined }}>
          {isProcessing ? 'Обработка...' : 'Кликните или перетащите файлы (PDF, JPG, PNG)'}
        </p>
        <p className="ant-upload-hint">Поддерживается массовая загрузка</p>
      </Dragger>

      {files.length > 0 && (
        <Card bodyStyle={{ padding: '0' }} style={{ overflow: 'hidden' }}>
          <div style={{ 
            height: '350px', 
            overflowY: 'auto', 
            padding: '12px 24px',
            borderBottom: '1px solid #f0f0f0' 
          }}>
            <List
              itemLayout="horizontal"
              dataSource={files}
              renderItem={(file) => (
                <List.Item 
                  actions={[
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleRemove(file)} 
                      disabled={isProcessing} 
                    />
                  ]}
                  style={{ padding: '10px 0' }}
                >
                  <List.Item.Meta 
                    avatar={<FileTextOutlined style={{ fontSize: 24, color: isProcessing ? '#ccc' : '#1890ff' }} />} 
                    title={<Text strong disabled={isProcessing}>{file.name}</Text>} 
                    description={`${(file.size / 1024).toFixed(1)} KB`} 
                  />
                </List.Item>
              )}
            />
          </div>

          <div style={{ padding: '16px 24px', background: '#fafafa' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Text type="secondary">Всего файлов: <strong style={{ color: '#000' }}>{files.length}</strong></Text>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  size="large" 
                  loading={isProcessing} 
                  onClick={handleStartProcessing}
                  disabled={isProcessing} 
                  style={{ background: BRAND_COLOR, borderColor: BRAND_COLOR, minWidth: 200 }}
                >
                  {isProcessing ? 'Распознавание...' : 'Распознать'}
                </Button>
              </Col>
            </Row>
          </div>
        </Card>
      )}
    </div>
  );
};

// 2. PREVIEW BLOCK
const PreviewBlock = ({ data, setData }) => {
  
  if (!data || !data.document_header) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  // --- Update Helpers ---

  // Update top-level header fields (e.g. document_number)
  const updateHeaderField = (field, value) => {
    setData(prev => ({
      ...prev,
      document_header: { ...prev.document_header, [field]: value }
    }));
  };

  // Update nested info fields (sender_info / receiver_info)
  const updateEntityInfo = (entityKey, field, value) => {
    // entityKey: 'sender_info' or 'receiver_info'
    setData(prev => ({
      ...prev,
      document_header: {
        ...prev.document_header,
        [entityKey]: {
          ...prev.document_header[entityKey],
          [field]: value
        }
      }
    }));
  };

  // Update items array
  const updateItem = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData(prev => ({ ...prev, items: newItems }));
  };

  // Update totals object
  const updateTotals = (field, value) => {
    setData(prev => ({
      ...prev,
      totals: { ...prev.totals, [field]: value }
    }));
  };

  // --- Sender/Receiver Table Config ---
  const headerDataSource = [
    {
      key: 'sender',
      role: 'Грузоотправитель',
      name: data.document_header?.sender_info?.name || '',
      unp: data.document_header?.sender_info?.unp || '',
      entityKey: 'sender_info'
    },
    {
      key: 'receiver',
      role: 'Грузополучатель',
      name: data.document_header?.receiver_info?.name || '',
      unp: data.document_header?.receiver_info?.unp || '',
      entityKey: 'receiver_info'
    }
  ];

  const headerColumns = [
    { 
      title: 'Роль', 
      dataIndex: 'role', 
      width: 150,
      render: (text) => <Text strong>{text}</Text>
    },
    { 
      title: 'Наименование / Адрес', 
      dataIndex: 'name', 
      render: (text, record) => (
        <Input.TextArea 
          autoSize 
          value={text} 
          onChange={(e) => updateEntityInfo(record.entityKey, 'name', e.target.value)} 
          bordered={false} 
        />
      )
    },
    { 
      title: 'УНП', 
      dataIndex: 'unp', 
      width: 150,
      render: (text, record) => (
        <Input 
          value={text} 
          onChange={(e) => updateEntityInfo(record.entityKey, 'unp', e.target.value)} 
          bordered={false} 
          placeholder="XXXXXXXXX"
        />
      )
    }
  ];

  // --- Items Table Config ---
  const itemColumns = [
    { 
      title: '№', 
      dataIndex: 'row_number', 
      width: 50, 
      fixed: 'left',
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'row_number', e.target.value)} bordered={false} style={{ textAlign: 'center' }} /> 
    },
    { 
      title: 'Наименование (Описание)', 
      dataIndex: 'description', 
      width: 250, 
      render: (val, _, i) => <Input.TextArea autoSize value={val} onChange={e => updateItem(i, 'description', e.target.value)} bordered={false} /> 
    },
    { 
      title: 'Ед.', 
      dataIndex: 'unit', 
      width: 60, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'unit', e.target.value)} bordered={false} /> 
    },
    { 
      title: 'Кол-во', 
      dataIndex: 'quantity', 
      width: 80, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'quantity', e.target.value)} bordered={false} /> 
    },
    { 
      title: 'Цена', 
      dataIndex: 'price_per_unit', 
      width: 100, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'price_per_unit', e.target.value)} bordered={false} /> 
    },
    { 
      title: 'Стоим. без НДС', 
      dataIndex: 'cost_without_vat', 
      width: 110, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'cost_without_vat', e.target.value)} bordered={false} /> 
    },
    { 
      title: 'НДС %', 
      dataIndex: 'vat_rate_percent', 
      width: 70, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'vat_rate_percent', e.target.value)} bordered={false} /> 
    },
    { 
      title: 'Сумма НДС', 
      dataIndex: 'vat_amount', 
      width: 100, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'vat_amount', e.target.value)} bordered={false} /> 
    },
    { 
      title: 'Стоим. с НДС', 
      dataIndex: 'cost_with_vat', 
      width: 110, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'cost_with_vat', e.target.value)} bordered={false} style={{ fontWeight: 'bold' }} /> 
    },
    { 
      title: 'Мест', 
      dataIndex: 'packages_count', 
      width: 70, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'packages_count', e.target.value)} bordered={false} /> 
    },
    { 
      title: 'Масса (т)', 
      dataIndex: 'mass_tonnes', 
      width: 90, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'mass_tonnes', e.target.value)} bordered={false} /> 
    },
    { 
      title: 'Примечание', 
      dataIndex: 'note', 
      width: 150, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'note', e.target.value)} bordered={false} /> 
    },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minHeight: '800px' }}>
        
        {/* --- HEADER --- */}
        <Row justify="space-between" gutter={16}>
          <Col span={8}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Номер документа:</Text>
            <Input 
              value={data.document_header?.document_number} 
              onChange={e => updateHeaderField('document_number', e.target.value)} 
              style={{ fontSize: '16px', fontWeight: 'bold' }} 
            />
          </Col>
          <Col span={8}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Дата:</Text>
            <Input 
              value={data.document_header?.document_date} 
              onChange={e => updateHeaderField('document_date', e.target.value)} 
            />
          </Col>
          <Col span={8}>
             <Text type="secondary" style={{ fontSize: '12px' }}>Всего с НДС (Заголовок):</Text>
             <Input 
              value={data.document_header?.total_amount_with_vat} 
              onChange={e => updateHeaderField('total_amount_with_vat', e.target.value)} 
            />
          </Col>
        </Row>

        <Divider style={{ margin: '15px 0' }} />

        {/* --- PARTIES (Sender/Receiver) --- */}
        <Table 
          dataSource={headerDataSource}
          columns={headerColumns}
          pagination={false}
          bordered
          size="small"
          style={{ marginBottom: 20 }}
        />

        {/* --- ITEMS --- */}
        <div style={{ marginBottom: 10, fontWeight: 'bold', fontSize: '14px' }}>I ТОВАРНЫЙ РАЗДЕЛ</div>
        <Table 
          dataSource={data.items || []} 
          columns={itemColumns} 
          pagination={false} 
          bordered 
          size="small" 
          scroll={{ x: 1300 }}
          rowKey="row_number"
        />

        {/* --- TOTALS --- */}
        {data.totals && (
           <div style={{ marginTop: 20, padding: '15px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
             <Title level={5}>Итого по накладной (Redactable Totals)</Title>
             <Row gutter={[16, 16]}>
                <Col span={4}>
                   <Text type="secondary">Всего кол-во</Text>
                   <Input value={data.totals.total_quantity} onChange={e => updateTotals('total_quantity', e.target.value)} size="small" />
                </Col>
                <Col span={4}>
                   <Text type="secondary">Всего мест</Text>
                   <Input value={data.totals.total_packages} onChange={e => updateTotals('total_packages', e.target.value)} size="small" />
                </Col>
                <Col span={4}>
                   <Text type="secondary">Всего масса (т)</Text>
                   <Input value={data.totals.total_mass_tonnes} onChange={e => updateTotals('total_mass_tonnes', e.target.value)} size="small" />
                </Col>
                <Col span={4}>
                   <Text type="secondary">Стоимость без НДС</Text>
                   <Input value={data.totals.total_cost_without_vat} onChange={e => updateTotals('total_cost_without_vat', e.target.value)} size="small" />
                </Col>
                 <Col span={4}>
                   <Text type="secondary">Сумма НДС</Text>
                   <Input value={data.totals.total_vat_amount} onChange={e => updateTotals('total_vat_amount', e.target.value)} size="small" />
                </Col>
                 <Col span={4}>
                   <Text type="secondary" strong>Всего с НДС</Text>
                   <Input value={data.totals.total_cost_with_vat} onChange={e => updateTotals('total_cost_with_vat', e.target.value)} style={{ fontWeight: 'bold' }} />
                </Col>
             </Row>
           </div>
        )}
      </div>
    </div>
  );
};

// 3. EXPORT BLOCK
const ExportBlock = ({ onExport }) => (
  <div style={{ textAlign: 'center', marginTop: 100 }}>
    <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 20 }} />
    <Title level={2}>Документы проверены!</Title>
    <Text>Данные готовы к выгрузке в вашу систему.</Text>
    <div style={{ marginTop: 40 }}>
      <Button 
        type="primary" 
        size="large" 
        icon={<ExportOutlined />} 
        onClick={onExport}
        style={{ background: BRAND_COLOR, borderColor: BRAND_COLOR, width: 250 }}
      >
        Скачать XML
      </Button>
    </div>
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

  // Mocking the NEW JSON Structure
  const handleProcessComplete = (data) => {
    const mockData = {
      processing_metadata: {
        has_attachment: true,
        attachment_page_count: 2
      },
      document_header: {
        document_number: "002-4813011900001",
        document_date: "03.10.2025",
        total_amount_with_vat: 12.28,
        sender_info: {
          name: "ООО 'Фуд Система', 220024 г. Минск, ул. Стебенева, 2а",
          unp: "193456789"
        },
        receiver_info: {
          name: "Питейный проспект, г. Минск, ул. Зыбицкая, 6, Клуба Бар",
          unp: "100987654"
        }
      },
      items: [
        {
          row_number: "1",
          description: "Сметана 24% 400гр пленка (Здравушка)",
          unit: "шт",
          quantity: 3,
          price_per_unit: 3.72,
          cost_without_vat: 11.16,
          vat_rate_percent: 10,
          vat_amount: 1.12,
          cost_with_vat: 12.28,
          packages_count: 1,
          mass_tonnes: 0.0012,
          note: ""
        }
      ],
      totals: {
        total_quantity: 3,
        total_cost_without_vat: 11.16,
        total_vat_amount: 1.12,
        total_cost_with_vat: 12.28,
        total_packages: 1,
        total_mass_tonnes: 0.0012
      }
    };

    // Use passed data if available (from real API), otherwise use new mock
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
        xml += `      <Description>${item.description}</Description>\n`;
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
