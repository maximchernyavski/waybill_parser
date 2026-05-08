import { 
  Typography, 
  Input, 
  Table,
  Row,
  Col,
  Divider,
  Spin
} from 'antd';

const { Title, Text } = Typography;

const PreviewBlock = ({ data, setData }) => {
  
  if (!data || !data.document_header) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const isAct = !!data.document_header.contractor_info;

  // --- Update Helpers ---

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
  const headerDataSource = isAct ? [
    {
      key: 'contractor',
      role: 'Исполнитель / Подрядчик',
      name: data.document_header?.contractor_info?.name || '',
      unp: data.document_header?.contractor_info?.unp || '',
      entityKey: 'contractor_info'
    },
    {
      key: 'customer',
      role: 'Заказчик',
      name: data.document_header?.customer_info?.name || '',
      unp: data.document_header?.customer_info?.unp || '',
      entityKey: 'customer_info'
    }
  ] : [
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
          variant="borderless" 
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
          variant="borderless" 
          placeholder="XXXXXXXXX"
        />
      )
    }
  ];

  // --- Items Table Config ---
  const sharedPrefixColumns = [
    { 
      title: '№', 
      dataIndex: 'row_number', 
      width: 50, 
      fixed: 'left',
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'row_number', e.target.value)} variant="borderless" style={{ textAlign: 'center' }} /> 
    }
  ];

  if (isAct) {
    sharedPrefixColumns.push({
      title: 'Код', 
      dataIndex: 'service_code', 
      width: 80, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'service_code', e.target.value)} variant="borderless" /> 
    });
  }

  const baseItemColumns = [
    ...sharedPrefixColumns,
    { 
      title: 'Наименование', 
      dataIndex: 'name', 
      width: 250, 
      render: (val, _, i) => <Input.TextArea autoSize value={val} onChange={e => updateItem(i, 'name', e.target.value)} variant="borderless" /> 
    },
    { 
      title: 'Ед.', 
      dataIndex: 'unit', 
      width: 60, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'unit', e.target.value)} variant="borderless" /> 
    },
    { 
      title: 'Кол-во', 
      dataIndex: 'quantity', 
      width: 80, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'quantity', e.target.value)} variant="borderless" /> 
    },
    { 
      title: 'Цена', 
      dataIndex: 'price_per_unit', 
      width: 100, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'price_per_unit', e.target.value)} variant="borderless" /> 
    },
    { 
      title: 'Стоим. без НДС', 
      dataIndex: 'cost_without_vat', 
      width: 110, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'cost_without_vat', e.target.value)} variant="borderless" /> 
    },
    { 
      title: isAct ? 'НДС' : 'НДС %', 
      dataIndex: isAct ? 'vat_rate' : 'vat_rate_percent', 
      width: isAct ? 100 : 70, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, isAct ? 'vat_rate' : 'vat_rate_percent', e.target.value)} variant="borderless" /> 
    },
    { 
      title: 'Сумма НДС', 
      dataIndex: 'vat_amount', 
      width: 100, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'vat_amount', e.target.value)} variant="borderless" /> 
    },
    { 
      title: 'Стоим. с НДС', 
      dataIndex: 'cost_with_vat', 
      width: 110, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'cost_with_vat', e.target.value)} variant="borderless" style={{ fontWeight: 'bold' }} /> 
    }
  ];

  const waybillSuffixColumns = [
    { 
      title: 'Мест', 
      dataIndex: 'packages_count', 
      width: 70, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'packages_count', e.target.value)} variant="borderless" /> 
    },
    { 
      title: 'Масса (т)', 
      dataIndex: 'mass_tonnes', 
      width: 90, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'mass_tonnes', e.target.value)} variant="borderless" /> 
    },
    { 
      title: 'Примечание', 
      dataIndex: 'note', 
      width: 150, 
      render: (val, _, i) => <Input value={val} onChange={e => updateItem(i, 'note', e.target.value)} variant="borderless" /> 
    }
  ];

  const itemColumns = isAct ? baseItemColumns : [...baseItemColumns, ...waybillSuffixColumns];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minHeight: '800px' }}>
        
        {/* --- HEADER --- */}
        <Row justify="space-between" gutter={16}>
          <Col span={isAct ? 12 : 12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Номер документа:</Text>
            <Input 
              value={data.document_header?.document_number} 
              onChange={e => updateHeaderField('document_number', e.target.value)} 
              style={{ fontSize: '16px', fontWeight: 'bold' }} 
            />
          </Col>
          <Col span={isAct ? 12 : 12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Дата:</Text>
            <Input 
              value={data.document_header?.document_date} 
              onChange={e => updateHeaderField('document_date', e.target.value)} 
            />
          </Col>
          {isAct && (
            <Col span={24} style={{marginTop: '10px'}}>
              <Text type="secondary" style={{ fontSize: '12px' }}>Договор:</Text>
              <Input 
                value={data.document_header?.contract_info} 
                onChange={e => updateHeaderField('contract_info', e.target.value)} 
              />
            </Col>
          )}
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
        <div style={{ marginBottom: 10, fontWeight: 'bold', fontSize: '14px' }}>
          {isAct ? 'ДЕТАЛИЗАЦИЯ УСЛУГ/РАБОТ' : 'I ТОВАРНЫЙ РАЗДЕЛ'}
        </div>
        <Table 
          dataSource={data.items || []} 
          columns={itemColumns} 
          pagination={false} 
          bordered 
          size="small" 
          scroll={{ x: isAct ? 1000 : 1300 }}
          rowKey="row_number"
        />

        {/* --- TOTALS --- */}
        {data.totals && (
           <div style={{ marginTop: 20, padding: '15px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
             <Title level={5}>{isAct ? 'Итого по акту' : 'Итого по накладной'}</Title>
             <Row gutter={[16, 16]}>
                {!isAct && (
                  <>
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
                  </>
                )}
                
                <Col span={isAct ? 8 : 4}>
                   <Text type="secondary">Стоимость без НДС</Text>
                   <Input value={data.totals.total_cost_without_vat} onChange={e => updateTotals('total_cost_without_vat', e.target.value)} size="small" />
                </Col>
                 <Col span={isAct ? 8 : 4}>
                   <Text type="secondary">Сумма НДС</Text>
                   <Input value={data.totals.total_vat_amount} onChange={e => updateTotals('total_vat_amount', e.target.value)} size="small" />
                </Col>
                 <Col span={isAct ? 8 : 4}>
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

export default PreviewBlock;