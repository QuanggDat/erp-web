//Các kiểu dữ liệu của phân hệ ERP, khớp với schema Prisma ở back-end
//Prisma trả kiểu Decimal về client dưới dạng chuỗi, nên tiền và số lượng đều là string

//Vai trò quyết định người dùng gọi được những route nào
type TRole = "ADMIN" | "SALES" | "PURCHASE" | "WAREHOUSE" | "HR" | "VIEWER";

//Đối tác dùng chung cho khách hàng và nhà cung cấp
type TPartnerType = "CUSTOMER" | "SUPPLIER" | "BOTH";

//Trạng thái chứng từ, dùng chung cho đơn mua và đơn bán
type TOrderStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

//Loại biến động tồn kho
type TMovementType = "IN" | "OUT" | "ADJUST";

interface IProductCategory {
    id: number;
    code: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    _count?: { products: number };
}

interface IProduct {
    id: number;
    code: string;
    name: string;
    unit: string;
    description: string | null;
    salePrice: string;
    purchasePrice: string;
    isActive: boolean;
    categoryId: number | null;
    category?: IProductCategory | null;
    createdAt: string;
    updatedAt: string;
}

interface IPartner {
    id: number;
    code: string;
    name: string;
    type: TPartnerType;
    taxCode: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface IWarehouse {
    id: number;
    code: string;
    name: string;
    address: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

//Tồn kho hiện tại theo cặp sản phẩm và kho
interface IStock {
    id: number;
    quantity: string;
    productId: number;
    warehouseId: number;
    product?: Pick<IProduct, "id" | "code" | "name" | "unit">;
    warehouse?: Pick<IWarehouse, "id" | "code" | "name">;
    updatedAt: string;
}

//Một dòng trong sổ nhật ký nhập xuất
interface IStockMovement {
    id: number;
    type: TMovementType;
    quantity: string;
    note: string | null;
    refType: string | null;
    refId: number | null;
    productId: number;
    warehouseId: number;
    product?: Pick<IProduct, "id" | "code" | "name" | "unit">;
    warehouse?: Pick<IWarehouse, "id" | "code" | "name">;
    createdAt: string;
}

//Một dòng hàng trong đơn mua hoặc đơn bán
interface IOrderItem {
    id: number;
    quantity: string;
    unitPrice: string;
    amount: string;
    productId: number;
    product?: Pick<IProduct, "id" | "code" | "name" | "unit">;
    //Giá vốn chỉ có trên dòng của đơn BÁN, và chỉ sau khi đơn được xác nhận.
    //Đơn còn nháp thì bằng "0" vì hàng chưa rời kho nên chưa biết giá vốn.
    unitCost?: string;
    costAmount?: string;
}

interface IPurchaseOrder {
    id: number;
    code: string;
    orderDate: string;
    status: TOrderStatus;
    totalAmount: string;
    note: string | null;
    supplierId: number;
    warehouseId: number;
    supplier?: IPartner;
    warehouse?: Pick<IWarehouse, "id" | "code" | "name">;
    items?: IOrderItem[];
    _count?: { items: number };
    createdAt: string;
    updatedAt: string;
}

interface ISalesOrder {
    id: number;
    code: string;
    orderDate: string;
    status: TOrderStatus;
    totalAmount: string;
    //Tổng giá vốn hàng bán, ghi lúc xác nhận đơn khi hàng thật sự rời kho.
    //Đơn còn nháp hoặc đã huỷ thì bằng "0".
    totalCost: string;
    note: string | null;
    customerId: number;
    warehouseId: number;
    customer?: IPartner;
    warehouse?: Pick<IWarehouse, "id" | "code" | "name">;
    items?: IOrderItem[];
    _count?: { items: number };
    createdAt: string;
    updatedAt: string;
}

//Phòng ban và chức danh có cùng cấu trúc
interface IOrgUnit {
    id: number;
    code: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    _count?: { employees: number };
}

interface IEmployee {
    id: number;
    code: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    hireDate: string;
    //KHÔNG có thông tin lương: tiền lương là dữ liệu nhạy cảm,
    //back-end cũng không lưu con số nào
    isActive: boolean;
    departmentId: number | null;
    positionId: number | null;
    department?: IOrgUnit | null;
    position?: IOrgUnit | null;
    createdAt: string;
    updatedAt: string;
}

interface IAttendance {
    id: number;
    workDate: string;
    workHours: string;
    note: string | null;
    employeeId: number;
    employee?: Pick<IEmployee, "id" | "code" | "firstName" | "lastName">;
    createdAt: string;
}

//CỐ Ý KHÔNG CÓ kiểu IPayroll: tiền lương là dữ liệu nhạy cảm, đã được gỡ
//khỏi cả database, API lẫn giao diện. Phân hệ nhân sự chỉ quản lý hồ sơ,
//phòng ban, chức danh và chấm công.

//===== BÁO CÁO GIÁ VỐN =====

//Một dòng trong bảng giá vốn, gom theo sản phẩm
interface ICogsByProduct {
    productId: number;
    code: string;
    name: string;
    unit: string;
    quantity: string; //tổng số lượng đã bán trong kỳ
    unitCost: string; //đơn giá vốn bình quân trong kỳ
    cost: string;     //tổng giá vốn
}

//Kết quả trả về của GET /reports/cogs
interface ICogsReport {
    summary: {
        productCount: number;
        quantity: string;
        cost: string;
    };
    products: ICogsByProduct[];
    //Các tháng có đơn đã xác nhận, dạng YYYY-MM, mới nhất trước.
    //Back-end trả kèm để dựng ô chọn tháng, khỏi phải gọi thêm một lượt.
    months: string[];
}
