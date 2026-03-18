// api.js
import axios from 'axios';

// 设置基础URL
let BASE_URL = 'http://localhost:8000';
//获取后端服务器地址
const update_background_server_url = (background_url)=>{
    BASE_URL = background_url
}
// GET请求封装
const request_get = (url, params = {}, callback, errorCallback) => {
    axios.get(`${BASE_URL}/${url}`, { params })
        .then(response => {
            callback(response.data);
        })
        .catch(error => {
            if (errorCallback) {
                errorCallback(`GET request failed: ${error.message}`);
            }
        });
};

// POST请求封装
const request_post = (url, data = {}, callback, errorCallback) => {
    axios.post(`${BASE_URL}/${url}`, data)
        .then(response => {
            callback(response.data);
        })
        .catch(error => {
            if (errorCallback) {
                errorCallback(`POST request failed: ${error.message}`);
            }
        });
};

const request_put = (url, data = {}, callback, errorCallback) => {
    axios.put(`${BASE_URL}/${url}`, data)
        .then(response => {
            callback(response.data);
        })
        .catch(error => {
            if (errorCallback) {
                errorCallback(`PUT request failed: ${error.message}`);
            }
        });
};

const request_delete = (url, callback, errorCallback) => {
    axios.delete(`${BASE_URL}/${url}`)
        .then(response => {
            callback(response.data);
        })
        .catch(error => {
            if (errorCallback) {
                errorCallback(`DELETE request failed: ${error.message}`);
            }
        });
};

const request_get_async = (url, params = {}) => axios.get(`${BASE_URL}/${url}`, { params }).then((response) => response.data);

const request_post_async = (url, data = {}) => axios.post(`${BASE_URL}/${url}`, data).then((response) => response.data);

const request_put_async = (url, data = {}) => axios.put(`${BASE_URL}/${url}`, data).then((response) => response.data);

const request_delete_async = (url) => axios.delete(`${BASE_URL}/${url}`).then((response) => response.data);

export {
    request_delete,
    request_delete_async,
    request_get,
    request_get_async,
    request_post,
    request_post_async,
    request_put,
    request_put_async,
    update_background_server_url
};
