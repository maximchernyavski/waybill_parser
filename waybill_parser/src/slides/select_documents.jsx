import {
  Button, 
  Upload, 
  List, 
  Typography,
  notification, // Import notification
  Card,
  Row,
  Col,
} from 'antd';

import { 
  InboxOutlined, 
  DeleteOutlined, 
  FileTextOutlined,
} from '@ant-design/icons';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const BRAND_COLOR = '#830e0e';

const API_URL = 'http://localhost:8080/process-document'; // Will fail in demo environment

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
          maxHeight: '70%',
          cursor: isProcessing ? 'not-allowed' : 'pointer'
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: isProcessing ? '#ccc' : BRAND_COLOR }} />
        </p>
        <p className="ant-upload-text" style={{ color: isProcessing ? '#999' : undefined }}>
          {isProcessing ? 'Обработка...' : 'Кликните или перетащите файлы (PNG)'}
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

export default SelectDocument