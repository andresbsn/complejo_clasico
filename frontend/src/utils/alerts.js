import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const alerts = {
    success: (title, text) => {
        return MySwal.fire({
            icon: 'success',
            title,
            text,
            confirmButtonColor: '#3085d6',
        });
    },
    error: (title, text) => {
        return MySwal.fire({
            icon: 'error',
            title,
            text,
            confirmButtonColor: '#d33',
        });
    },
    warning: (title, text) => {
        return MySwal.fire({
            icon: 'warning',
            title,
            text,
            confirmButtonColor: '#f8bb86',
        });
    },
    info: (title, text) => {
        return MySwal.fire({
            icon: 'info',
            title,
            text,
            confirmButtonColor: '#3085d6',
        });
    },
    confirm: (title, text, confirmButtonText = 'Confirmar', cancelButtonText = 'Cancelar') => {
        return MySwal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText,
            cancelButtonText
        });
    },
    toast: (icon, title) => {
        const Toast = MySwal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        return Toast.fire({
            icon,
            title
        });
    }
};

export default alerts;
