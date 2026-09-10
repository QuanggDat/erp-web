'use client'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { API_URL, sendRequest } from '@/utils/api';
import { mutateBlogs } from '@/utils/mutate.blogs';

interface IProps {
    showModalCreate: boolean;
    setShowModalCreate: (value: boolean) => void;
    //báo cho trang cha nhảy về trang 1, nơi blog mới nhất nằm
    onCreated: () => void;
}

function CreateModal(props: IProps) {
    const { showModalCreate, setShowModalCreate, onCreated } = props;

    //3 field này khớp đúng với InsertNoteDTO ở back-end
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [url, setUrl] = useState<string>("");

    const handleSubmit = async () => {
        if (!title) {
            toast.error("Title không được để trống !");
            return;
        }
        if (!description) {
            toast.error("Description không được để trống !");
            return;
        }
        //back-end validate @IsUrl nên url bắt buộc phải đúng định dạng
        if (!url) {
            toast.error("Url không được để trống !");
            return;
        }

        try {
            //POST /notes -> userId được back-end tự gắn từ accessToken
            const res = await sendRequest<IBlog>({
                url: `${API_URL}/notes`,
                method: "POST",
                body: { title, description, url }
            });

            if (res?.id) {
                toast.success("Tạo blog mới thành công !");
                handleCloseModal();
                await mutateBlogs();
                onCreated();
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const handleCloseModal = () => {
        setTitle("");
        setDescription("");
        setUrl("");
        setShowModalCreate(false);
    }

    return (
        <>
            <Modal
                show={showModalCreate}
                onHide={() => handleCloseModal()}
                backdrop="static"
                keyboard={false}
                size='lg'
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add New A Blog</Modal.Title>
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
                            <Form.Text className='text-muted'>
                                Phải là đường dẫn hợp lệ, ví dụ: https://example.com
                            </Form.Text>
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
                    <Button variant="primary" onClick={() => handleSubmit()}>Save</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default CreateModal;
