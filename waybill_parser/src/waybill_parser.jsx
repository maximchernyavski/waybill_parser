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
const API_URL = '/api/recognize'; // Will fail in demo environment

// --- Components ---

const Logo = () => (
  <div style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BRAND_COLOR, color: 'white', padding: '10px' }}>
    <div style={{ fontSize: '48px', fontWeight: 'bold', lineHeight: '1' }}>WP</div>
    <div style={{ fontSize: '10px', marginTop: '5px', letterSpacing: '1px' }}>WAYBILL PARSER</div>
  </div>
);

// 1. SELECT DOCUMENT BLOCK (With Notification Hook)
const SelectDocument = ({ files, setFiles, onProcess }) => {
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification(); // Ant Design v5 Notification Hook

  const handleRemove = (file) => {
    setFiles((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  const props = {
    name: 'file',
    multiple: true,
    fileList: files,
    beforeUpload: (file) => {
      setFiles((prev) => [...prev, file]); 
      return false;
    },
    onRemove: handleRemove,
  };

  const handleStartProcessing = async () => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // Attempt to send request
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      // Check for non-2xx status codes (e.g., 404, 500)
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      onProcess(data);

    } catch (error) {
      console.error("Processing failed:", error);
      
      // Trigger the "Server is down" notification
      api.error({
        message: 'Ошибка подключения',
        description: 'Server is down. Please try again later.',
        placement: 'topRight',
        duration: 4, // Seconds to stay on screen
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', height: '100%' }}>
      {contextHolder} {/* Render the notification context */}
      
      <Title level={4}>Выберите документы для обработки</Title>
      
      <Dragger {...props} style={{ padding: 40, background: '#fff', borderRadius: '8px', marginBottom: 20 }}>
        <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: BRAND_COLOR }} /></p>
        <p className="ant-upload-text">Кликните или перетащите файлы (PDF, JPG, PNG)</p>
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
                    />
                  ]}
                  style={{ padding: '10px 0' }}
                >
                  <List.Item.Meta 
                    avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />} 
                    title={<Text strong>{file.name}</Text>} 
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
                  loading={loading}
                  onClick={handleStartProcessing}
                  style={{ background: BRAND_COLOR, borderColor: BRAND_COLOR, minWidth: 200 }}
                >
                  Распознать
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
  
  const updateHeader = (field, value) => {
    setData({ ...data, document_header: { ...data.document_header, [field]: value } });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, items: newItems });
  };

  const columns = [
    { title: '№', dataIndex: 'row_number', width: 50 },
    { title: 'Наименование', dataIndex: 'name', render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'name', e.target.value)} bordered={false} /> },
    { title: 'Ед.', dataIndex: 'unit', width: 60, render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'unit', e.target.value)} bordered={false} /> },
    { title: 'Кол-во', dataIndex: 'quantity', width: 80, render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'quantity', e.target.value)} bordered={false} /> },
    { title: 'Цена', dataIndex: 'price_per_unit', width: 100, render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'price_per_unit', e.target.value)} bordered={false} /> },
    { title: 'НДС %', dataIndex: 'vat_rate_percent', width: 80, render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'vat_rate_percent', e.target.value)} bordered={false} /> },
    { title: 'Сумма НДС', dataIndex: 'vat_amount', width: 100, render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'vat_amount', e.target.value)} bordered={false} /> },
    { title: 'Всего с НДС', dataIndex: 'total_cost_with_vat', width: 120, render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'total_cost_with_vat', e.target.value)} bordered={false} style={{fontWeight: 'bold'}} /> },
  ];

  if (!data) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ background: '#fff', padding: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minHeight: '800px' }}>
        
        <Row justify="space-between">
          <Col span={12}>
            <Text type="secondary">Номер документа:</Text>
            <Input value={data.document_header.document_number} onChange={e => updateHeader('document_number', e.target.value)} style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 10 }} />
          </Col>
          <Col span={8}>
            <Text type="secondary">Дата:</Text>
            <Input value={data.document_header.document_date} onChange={e => updateHeader('document_date', e.target.value)} />
          </Col>
        </Row>

        <Divider />

        <Row gutter={32}>
          <Col span={12}>
            <Text type="secondary">Грузоотправитель:</Text>
            <Input.TextArea autoSize value={data.document_header.sender_name} onChange={e => updateHeader('sender_name', e.target.value)} style={{ marginBottom: 20 }} />
          </Col>
          <Col span={12}>
            <Text type="secondary">Грузополучатель:</Text>
            <Input.TextArea autoSize value={data.document_header.receiver_name} onChange={e => updateHeader('receiver_name', e.target.value)} />
          </Col>
        </Row>

        <Table 
          dataSource={data.items} 
          columns={columns} 
          pagination={false} 
          bordered 
          size="small" 
          rowKey="row_number"
          footer={() => (
            <div style={{ textAlign: 'right', fontSize: '16px' }}>
              <strong>Итого к оплате: </strong>
              <Input 
                value={data.document_header.total_amount_with_vat} 
                onChange={e => updateHeader('total_amount_with_vat', e.target.value)}
                style={{ width: 150, fontWeight: 'bold', textAlign: 'right' }} 
                bordered={false}
              />
            </div>
          )}
        />

        <div style={{ marginTop: 30, padding: '15px', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #eee' }}>
          <Text strong>Заметки парсера:</Text><br/>
          <Text italic>{data.processing_metadata.parsing_notes}</Text>
        </div>
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

  // Reset state if all files are removed
  useEffect(() => {
    if (files.length === 0) {
      setApiData(null); 
      setCurrent(0);    
    }
  }, [files]);

  const handleProcessComplete = (data) => {
    setApiData(data);
    setCurrent(1);
    message.success('Документ успешно обработан');
  };

  const handleExport = () => {
    message.loading('Формирование XML...', 1).then(() => {
      message.success('Файл успешно сохранен');
    });
  };

  const steps = [
    { title: 'Выберите документы', content: <SelectDocument files={files} setFiles={setFiles} onProcess={handleProcessComplete} /> },
    { title: 'Предпросмотр', content: <PreviewBlock data={apiData} setData={setApiData} /> },
    { title: 'Экспорт', content: <ExportBlock onExport={handleExport} /> }
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider width={260} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <Logo />
        <div style={{ padding: '30px 20px' }}>
          <Steps
            direction="vertical"
            current={current}
            onChange={c => (c < current || apiData) && setCurrent(c)}
          >
            {steps.map((s, i) => (
              <Step key={s.title} title={s.title} disabled={i > 0 && !apiData} />
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
