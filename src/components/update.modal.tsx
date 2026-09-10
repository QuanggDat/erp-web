'use client'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { API_URL, sendRequest } from '@/utils/api';
import { mutateBlogs } from '@/utils/mutate.blogs';

interface IProps {
    showModalUpdate: boolean;
    setShowModalUpdate: (value: boolean) => void;
    blog: IBlog | null;
    setBlog: (value: IBlog | null) => void;
}

function UpdateModal(props: IProps) {
    const { showModalUpdate, setShowModalUpdate, blog, setBlog } = props;

    const [id, setId] = useState<number>(0);
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [url, setUrl] = useState<string>("");

    //mỗi lần bấm Edit ở bảng, đổ dữ liệu blog đang chọn vào form
    useEffect(() => {
        if (blog && blog.id) {
            setId(blog.id);
            setTitle(blog.title);
            setDescription(blog.description);
            setUrl(blog.url);
        }
    }, [blog])

    const handleSubmit = async () => {
        if (!title) {
            toast.error("Title không được để trống !");
            return;
        }
        if (!description) {
            toast.error("Description không được để trống !");
            return;
        }
        if (!url) {
            toast.error("Url không được để trống !");
            return;
        }

        try {
            //back-end dùng @Patch(':id') chứ không phải PUT
            const res = await sendRequest<IBlog>({
                url: `${API_URL}/notes/${id}`,
                method: "PATCH",
                body: { title, description, url }
            });

            if (res?.id) {
                toast.warning("Cập nhật blog thành công !");
                handleCloseModal();
                mutateBlogs();
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const handleCloseModal = () => {
        setTitle("");
        setDescription("");
        setUrl("");
        setBlog(null);
        setShowModalUpdate(false);
    }

    return (
        <>
            <Modal
                show={showModalUpdate}
                onHide={() => handleCloseModal()}
                backdrop="static"
                keyboard={false}
                size='lg'
            >
                <Modal.Header closeButton>
                    <Modal.Title>Update A Blog</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control type="text" placeholder="..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Url</Form.Label>
                            <Form.Control type="text" placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => handleCloseModal()}>
                        Close
                    </Button>
                    <Button variant="warning" onClick={() => handleSubmit()}>Update</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default UpdateModal;
