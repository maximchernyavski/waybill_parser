import {
  Button, 
  Typography,
} from 'antd';

import { 
  ExportOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const BRAND_COLOR = '#830e0e';

const ExportBlock = ({ onExport, onExportJson }) => (
  <div style={{ textAlign: 'center', marginTop: 100 }}>
    <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 20 }} />
    <Title level={2}>Документы проверены!</Title>
    <Text>Данные готовы к выгрузке в вашу систему.</Text>
    <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: '20px' }}>
      <Button 
        type="primary" 
        size="large" 
        icon={<ExportOutlined />} 
        onClick={onExport}
        style={{ background: BRAND_COLOR, borderColor: BRAND_COLOR, width: 250 }}
      >
        Скачать XML
      </Button>
      <Button 
        size="large" 
        icon={<ExportOutlined />} 
        onClick={onExportJson}
        style={{ color: BRAND_COLOR, borderColor: BRAND_COLOR, width: 250 }}
      >
        Скачать JSON
      </Button>
    </div>
  </div>
);

export default ExportBlock