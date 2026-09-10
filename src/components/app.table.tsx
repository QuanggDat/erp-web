'use client'
import Table from 'react-bootstrap/Table';
import { Button } from 'react-bootstrap';
import CreateModal from './create.modal';
import { useState } from 'react';
import UpdateModal from './update.modal';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { API_URL, sendRequest } from '@/utils/api';
import { mutateBlogs } from '@/utils/mutate.blogs';

interface IProps {
    blogs: IBlog[];
    page: number;
    limit: number;
    onCreated: () => void;
}

const AppTable = (props: IProps) => {
    const { blogs, page, limit, onCreated } = props;

    const [blog, setBlog] = useState<IBlog | null>(null);
    const [showModalCreate, setShowModalCreate] = useState<boolean>(false);
    const [showModalUpdate, setShowModalUpdate] = useState<boolean>(false);

    const handleDeleteBlog = async (id: number) => {
        if (confirm(`Bạn có chắc muốn xoá blog này (id = ${id}) ?`)) {
            try {
                //DELETE /notes/:id -> back-end trả về 204 No Content
                await sendRequest({
                    url: `${API_URL}/notes/${id}`,
                    method: "DELETE"
                });
                toast.success("Xoá blog thành công !");
                //xoá một bản ghi làm lệch mọi trang phía sau, nên làm mới toàn bộ cache danh sách
                mutateBlogs();
            } catch (error: any) {
                toast.error(error.message);
            }
        }
    }

    return (
        <>
            <div
                className='mb-3'
                style={{ display: "flex", justifyContent: "space-between" }}>
                <h3>Table Blogs</h3>
                <Button variant="secondary"
                    onClick={() => setShowModalCreate(true)}
                >Add New</Button>
            </div>
            <Table bordered hover size="sm">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {blogs.length === 0 &&
                        <tr>
                            <td colSpan={4} className='text-center text-muted'>
                                Không có dữ liệu
                            </td>
                        </tr>
                    }
                    {blogs.map((item, index) => {
                        return (
                            <tr key={item.id}>
                                {/* số thứ tự chạy liên tục giữa các trang, không phải id */}
                                <td>{(page - 1) * limit + index + 1}</td>
                                <td>{item.title}</td>
                                <td>{item.description}</td>
                                <td>
                                    <Link
                                        className='btn btn-primary'
                                        href={`/blogs/${item.id}`}>View</Link>

                                    <Button variant='warning' className='mx-3'
                                        onClick={() => {
                                            setBlog(item);
                                            setShowModalUpdate(true);
                                        }}
                                    >Edit</Button>
                                    <Button variant='danger'
                                        onClick={() => handleDeleteBlog(item.id)}
                                    >Delete</Button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </Table>
            <CreateModal
                showModalCreate={showModalCreate}
                setShowModalCreate={setShowModalCreate}
                onCreated={onCreated}
            />
            <UpdateModal
                showModalUpdate={showModalUpdate}
                setShowModalUpdate={setShowModalUpdate}
                blog={blog}
                setBlog={setBlog}
            />
        </>
    )
}

export default AppTable;
