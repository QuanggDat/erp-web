'use client'
import { Button, Form, Table } from 'react-bootstrap';
import { formatMoney } from '@/utils/erp';

//Một dòng hàng đang nhập; giữ ở dạng chuỗi vì đây là giá trị của ô input
export interface IEditorLine {
    productId: string;
    quantity: string;
    unitPrice: string;
}

interface IProps {
    lines: IEditorLine[];
    onChange: (lines: IEditorLine[]) => void;
    products: IProduct[];
    //đơn bán lấy giá bán, đơn mua lấy giá mua làm giá gợi ý
    priceField: "salePrice" | "purchasePrice";
    disabled?: boolean;
}

//Bảng nhập các dòng hàng của một chứng từ
//Dùng chung cho đơn mua và đơn bán vì hai bên có cấu trúc dòng giống hệt nhau
const OrderItemsEditor = (props: IProps) => {
    const { lines, onChange, products, priceField, disabled } = props;

    const addLine = () => {
        onChange([...lines, { productId: "", quantity: "1", unitPrice: "0" }]);
    }

    const removeLine = (index: number) => {
        onChange(lines.filter((_, i) => i !== index));
    }

    const updateLine = (index: number, patch: Partial<IEditorLine>) => {
        onChange(lines.map((line, i) => i === index ? { ...line, ...patch } : line));
    }

    //chọn sản phẩm thì tự điền giá gợi ý, người dùng vẫn sửa được
    const handleSelectProduct = (index: number, productId: string) => {
        const product = products.find(p => String(p.id) === productId);
        updateLine(index, {
            productId,
            unitPrice: product ? String(product[priceField]) : "0",
        });
    }

    const lineAmount = (line: IEditorLine) =>
        Number(line.quantity || 0) * Number(line.unitPrice || 0);

    const total = lines.reduce((sum, line) => sum + lineAmount(line), 0);

    return (
        <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold small">Chi tiết hàng hoá</span>
                {!disabled &&
                    <Button variant="outline-primary" size="sm" onClick={addLine}>
                        Thêm dòng
                    </Button>
                }
            </div>

            <Table bordered size="sm" responsive className="mb-2">
                <thead>
                    <tr>
                        <th style={{ minWidth: 220 }}>Sản phẩm</th>
                        <th style={{ width: 110 }}>Số lượng</th>
                        <th style={{ width: 140 }}>Đơn giá</th>
                        <th style={{ width: 130 }} className="text-end">Thành tiền</th>
                        {!disabled && <th style={{ width: 60 }}></th>}
                    </tr>
                </thead>
                <tbody>
                    {lines.length === 0 &&
                        <tr>
                            <td colSpan={disabled ? 4 : 5} className="text-center text-muted py-3">
                                Chưa có dòng hàng nào. Bấm &quot;Thêm dòng&quot; để bắt đầu.
                            </td>
                        </tr>
                    }
                    {lines.map((line, index) => (
                        <tr key={index}>
                            <td>
                                <Form.Select
                                    size="sm"
                                    value={line.productId}
                                    disabled={disabled}
                                    onChange={(e) => handleSelectProduct(index, e.target.value)}
                                >
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.code} - {p.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </td>
                            <td>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    min={0}
                                    value={line.quantity}
                                    disabled={disabled}
                                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                                />
                            </td>
                            <td>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    min={0}
                                    value={line.unitPrice}
                                    disabled={disabled}
                                    onChange={(e) => updateLine(index, { unitPrice: e.target.value })}
                                />
                            </td>
                            <td className="text-end align-middle">
                                {formatMoney(lineAmount(line))}
                            </td>
                            {!disabled &&
                                <td className="text-center align-middle">
                                    <Button variant="outline-danger" size="sm"
                                        onClick={() => removeLine(index)}
                                    >X</Button>
                                </td>
                            }
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={3} className="text-end fw-semibold">Tổng cộng</td>
                        <td className="text-end fw-bold">{formatMoney(total)}</td>
                        {!disabled && <td></td>}
                    </tr>
                </tfoot>
            </Table>
        </div>
    );
}

export default OrderItemsEditor;
