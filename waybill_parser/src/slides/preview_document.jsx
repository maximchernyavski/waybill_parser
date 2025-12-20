import { 
  Typography, 
  Input, 
  Table,
  Row,
  Col,
  Divider,
  Spin
} from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const PreviewTable = ({data, setData}) => {
    const updateHeaderField = (field, value) => {
    setData(prev => ({
      ...prev,
      document_header: { ...prev.document_header, [field]: value }
    }));
  };

  const updateEntityInfo = (entityKey, field, value) => {
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

  const updateItem = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData(prev => ({ ...prev, items: newItems }));
  };

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
    // CHANGED: Replaced description with 'name'
    { 
      title: 'Наименование', 
      dataIndex: 'name', 
      width: 250, 
      render: (val, _, i) => <Input.TextArea autoSize value={val} onChange={e => updateItem(i, 'name', e.target.value)} bordered={false} /> 
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
             <Title level={5}>Итого по накладной</Title>
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
}

const FalseSpinner = () => {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
}

const PreviewBlock = ({ data, setData }) => {
    const [needTable, setNeedTable] = useState(false)

    useEffect(() => {
        if (!data || !data.document_header) {
            setNeedTable(false)
        } else {  
            setNeedTable(true)  
        }
    }, [data])

    return needTable ? <PreviewTable data={data} setData={setData} /> : FalseSpinner
};

export default PreviewBlock