// Cấu hình API
const API_BASE_URL = 'https://applicably-cotemporaneous-frieda.ngrok-free.dev';

// Biến toàn cục
let tasks = [];
let employees = [];

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', function() {
    checkAPIStatus();
    loadInitialData();
});

// Kiểm tra trạng thái API
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            document.getElementById('statusIndicator').className = 'status-indicator';
            document.getElementById('statusText').textContent = 'API đang hoạt động';
        } else {
            throw new Error('API không phản hồi');
        }
    } catch (error) {
        document.getElementById('statusIndicator').className = 'status-indicator offline';
        document.getElementById('statusText').textContent = 'API offline - Vui lòng kiểm tra kết nối';
        console.error('Lỗi kết nối API:', error);
    }
}

// Tải dữ liệu ban đầu
async function loadInitialData() {
    await loadTasks();
    await loadEmployees();
    populateSelects();
}

// Tải danh sách tasks từ task.csv
async function loadTasks() {
    try {
        showLoading('tasksList', 'Đang tải tasks từ CSV...');
        const response = await fetch('./task.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                tasks = results.data;
                displayTasksList(tasks);
            },
            error: function(error) {
                console.error('Lỗi khi phân tích CSV tasks:', error);
                document.getElementById('tasksList').innerHTML = 
                    `<div class="error">Lỗi khi tải tasks: ${error.message}</div>`;
            }
        });
    } catch (error) {
        console.error('Lỗi tải tasks:', error);
        document.getElementById('tasksList').innerHTML = 
            `<div class="error">Lỗi khi tải tasks: ${error.message}</div>`;
    }
}

// Tải danh sách employees từ employees.csv
async function loadEmployees() {
    try {
        showLoading('employeesList', 'Đang tải nhân viên từ CSV...');
        const response = await fetch('./employees.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                employees = results.data;
                displayEmployeesList(employees);
            },
            error: function(error) {
                console.error('Lỗi khi phân tích CSV employees:', error);
                document.getElementById('employeesList').innerHTML = 
                    `<div class="error">Lỗi khi tải nhân viên: ${error.message}</div>`;
            }
        });
    } catch (error) {
        console.error('Lỗi tải employees:', error);
        document.getElementById('employeesList').innerHTML = 
            `<div class="error">Lỗi khi tải nhân viên: ${error.message}</div>`;
    }
}

// Tải danh sách assignments từ assignments.csv (nếu cần)
async function loadAssignments() {
    try {
        const response = await fetch('./assignments.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const assignments = results.data;
                console.log('Assignments:', assignments);
                // Xử lý dữ liệu assignments nếu cần
            },
            error: function(error) {
                console.error('Lỗi khi phân tích CSV assignments:', error);
            }
        });
    } catch (error) {
        console.error('Lỗi tải assignments:', error);
    }
}

// Điền dữ liệu vào các select
function populateSelects() {
    const taskSelect = document.getElementById('taskSelect');
    const employeeSelect = document.getElementById('employeeSelect');
    const feedbackTask = document.getElementById('feedbackTask');
    const feedbackEmployee = document.getElementById('feedbackEmployee');

    // Xóa options cũ
    [taskSelect, employeeSelect, feedbackTask, feedbackEmployee].forEach(select => {
        select.innerHTML = '<option value="">-- Chọn --</option>';
    });

    // Thêm tasks
    tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.task_id;
        option.textContent = `${task.task_id} - ${task.title} (${task.difficulty_level})`;
        taskSelect.appendChild(option.cloneNode(true));
        feedbackTask.appendChild(option);
    });

    // Thêm employees
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.employee_id;
        option.textContent = `${employee.employee_id} - ${employee.name} (${employee.experience_years} năm kinh nghiệm)`;
        employeeSelect.appendChild(option.cloneNode(true));
        feedbackEmployee.appendChild(option);
    });
}

// Hiển thị danh sách tasks
function displayTasksList(tasks) {
    const container = document.getElementById('tasksList');
    if (tasks.length === 0) {
        container.innerHTML = '<p>Không có task nào.</p>';
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="result-item">
            <div class="result-header">
                <span class="result-id">${task.task_id} - ${task.title}</span>
                <span class="result-score">${task.difficulty_level}</span>
            </div>
            <div class="skills-tags">
                ${Array.isArray(task.required_skills) ? 
                  task.required_skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') : 
                  '<span class="skill-tag">No skills</span>'}
            </div>
        </div>
    `).join('');
}

// Hiển thị danh sách employees
function displayEmployeesList(employees) {
    const container = document.getElementById('employeesList');
    if (employees.length === 0) {
        container.innerHTML = '<p>Không có nhân viên nào.</p>';
        return;
    }

    container.innerHTML = employees.map(employee => `
        <div class="result-item">
            <div class="result-header">
                <span class="result-id">${employee.employee_id} - ${employee.name}</span>
                <span class="result-score">${employee.experience_years} năm</span>
            </div>
            <div class="skills-tags">
                ${Array.isArray(employee.skills) ? 
                  employee.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') : 
                  '<span class="skill-tag">No skills</span>'}
            </div>
        </div>
    `).join('');
}

// Gợi ý nhân viên cho task
async function getEmployeeRecommendations() {
    const taskId = document.getElementById('taskSelect').value;
    const topK = document.getElementById('topK').value;

    if (!taskId) {
        alert('Vui lòng chọn một task');
        return;
    }

    try {
        showLoading('recommendationResults', 'Đang tìm nhân viên phù hợp...');
        
        const response = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task_id: taskId,
                top_k: parseInt(topK)
            })
        });

        const data = await response.json();

        if (response.ok) {
            displayEmployeeRecommendations(data);
        } else {
            throw new Error(data.detail || 'Lỗi khi lấy gợi ý');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        document.getElementById('recommendationResults').innerHTML = 
            `<div class="error">Lỗi: ${error.message}</div>`;
    }
}

// Gợi ý task cho nhân viên
async function getTaskRecommendations() {
    const employeeId = document.getElementById('employeeSelect').value;
    const topK = document.getElementById('topKEmployee').value;

    if (!employeeId) {
        alert('Vui lòng chọn một nhân viên');
        return;
    }

    try {
        showLoading('recommendationResults', 'Đang tìm task phù hợp...');
        
        const response = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                employee_id: employeeId,
                top_k: parseInt(topK)
            })
        });

        const data = await response.json();

        if (response.ok) {
            displayTaskRecommendations(data);
        } else {
            throw new Error(data.detail || 'Lỗi khi lấy gợi ý');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        document.getElementById('recommendationResults').innerHTML = 
            `<div class="error">Lỗi: ${error.message}</div>`;
    }
}

// Hiển thị gợi ý nhân viên
function displayEmployeeRecommendations(data) {
    const container = document.getElementById('recommendationResults');
    
    if (!data.recommendations || data.recommendations.length === 0) {
        container.innerHTML = '<div class="error">Không tìm thấy nhân viên phù hợp</div>';
        return;
    }

    container.innerHTML = `
        <div class="success">
            <strong>${data.total_recommendations} nhân viên được gợi ý cho task ${data.task_id}</strong>
        </div>
        ${data.recommendations.map((rec, index) => `
            <div class="result-item">
                <div class="result-header">
                    <span class="result-id">${index + 1}. ${rec.employee_id}</span>
                    <span class="result-score">${rec.match_percentage}</span>
                </div>
                <div class="result-explanation">
                    Điểm phù hợp: ${rec.match_score}
                </div>
            </div>
        `).join('')}
    `;
}

// Hiển thị gợi ý task
function displayTaskRecommendations(data) {
    const container = document.getElementById('recommendationResults');
    
    if (!data.recommendations || data.recommendations.length === 0) {
        container.innerHTML = '<div class="error">Không tìm thấy task phù hợp</div>';
        return;
    }

    container.innerHTML = `
        <div class="success">
            <strong>${data.total_recommendations} task được gợi ý cho nhân viên ${data.employee_id}</strong>
        </div>
        ${data.recommendations.map((rec, index) => `
            <div class="result-item">
                <div class="result-header">
                    <span class="result-id">${index + 1}. ${rec.task_id}</span>
                    <span class="result-score">${rec.match_percentage}</span>
                </div>
                <div class="result-explanation">
                    Điểm phù hợp: ${rec.match_score}
                </div>
            </div>
        `).join('')}
    `;
}

// Gợi ý cho task mới
async function recommendForNewTask() {
    const description = document.getElementById('taskDescription').value;
    const skills = document.getElementById('requiredSkills').value;
    const difficulty = document.getElementById('difficultyLevel').value;
    const deadline = document.getElementById('deadlineDays').value;
    const duration = document.getElementById('expectedDuration').value;

    if (!description || !skills) {
        alert('Vui lòng nhập đầy đủ mô tả và kỹ năng yêu cầu');
        return;
    }

    try {
        showLoading('newTaskResults', 'Đang phân tích và tìm nhân viên phù hợp...');
        
        const response = await fetch(`${API_BASE_URL}/recommend/new-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: description,
                required_skills: skills.split(',').map(s => s.trim()),
                difficulty_level: difficulty,
                deadline_days: parseInt(deadline),
                expected_duration: parseInt(duration),
                top_k: 5
            })
        });

        const data = await response.json();

        if (response.ok) {
            displayNewTaskResults(data);
        } else {
            throw new Error(data.detail || 'Lỗi khi xử lý task mới');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        document.getElementById('newTaskResults').innerHTML = 
            `<div class="error">Lỗi: ${error.message}</div>`;
    }
}

// Hiển thị kết quả task mới
function displayNewTaskResults(data) {
    const container = document.getElementById('newTaskResults');
    
    if (!data.recommendations || data.recommendations.length === 0) {
        container.innerHTML = '<div class="error">Không tìm thấy nhân viên phù hợp</div>';
        return;
    }

    container.innerHTML = `
        <div class="success">
            <strong>${data.recommendations.length} nhân viên được gợi ý cho task mới</strong>
        </div>
        ${data.recommendations.map((rec, index) => `
            <div class="result-item">
                <div class="result-header">
                    <span class="result-id">${index + 1}. ${rec.employee_id}</span>
                    <span class="result-score">${rec.match_percentage}</span>
                </div>
                <div class="result-explanation">
                    <strong>Giải thích:</strong> ${rec.explanation || 'Không có giải thích'}
                </div>
                <div class="result-explanation">
                    <strong>Điểm phù hợp:</strong> ${rec.match_score}
                </div>
            </div>
        `).join('')}
    `;
}

// Gửi phản hồi
async function submitFeedback() {
    const taskId = document.getElementById('feedbackTask').value;
    const employeeId = document.getElementById('feedbackEmployee').value;
    const score = parseFloat(document.getElementById('feedbackScore').value);
    const success = document.getElementById('successStatus').value === 'true';

    if (!taskId || !employeeId) {
        alert('Vui lòng chọn task và nhân viên');
        return;
    }

    if (score < 0 || score > 1) {
        alert('Điểm đánh giá phải từ 0 đến 1');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task_id: taskId,
                employee_id: employeeId,
                feedback_score: score,
                success: success
            })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('feedbackResult').innerHTML = `
                <div class="success">
                    <strong>✅ Phản hồi đã được gửi thành công!</strong>
                    <br>Loss: ${data.loss}
                    <br>${data.message}
                </div>
            `;
        } else {
            throw new Error(data.detail || 'Lỗi khi gửi phản hồi');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        document.getElementById('feedbackResult').innerHTML = 
            `<div class="error">Lỗi: ${error.message}</div>`;
    }
}

// Chuyển tab
function switchTab(tabName) {
    // Ẩn tất cả tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Hiển thị tab được chọn
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`).classList.add('active');

    // Tải lại dữ liệu nếu cần
    if (tabName === 'data') {
        loadTasks();
        loadEmployees();
    }
}

// Hiển thị loading
function showLoading(elementId, message = 'Đang tải...') {
    document.getElementById(elementId).innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
}