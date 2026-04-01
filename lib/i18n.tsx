"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "tr" | "ar";

const translations: Record<string, Record<Lang, string>> = {
  // ─── App Title ───
  "app.name": { en: "NUR NIL TEKSTIL", tr: "NUR NIL TEKSTİL", ar: "نور نيل تكستيل" },
  "app.subtitle": { en: "HR Platform", tr: "İK Platformu", ar: "منصة الموارد البشرية" },
  "app.hr_platform": { en: "Human Resources Platform", tr: "İnsan Kaynakları Platformu", ar: "منصة الموارد البشرية" },

  // ─── Login ───
  "login.title": { en: "Sign in to your account", tr: "Hesabınıza giriş yapın", ar: "تسجيل الدخول إلى حسابك" },
  "login.email": { en: "Email", tr: "E-posta", ar: "البريد الإلكتروني" },
  "login.password": { en: "Password", tr: "Şifre", ar: "كلمة المرور" },
  "login.signin": { en: "Sign In", tr: "Giriş Yap", ar: "تسجيل الدخول" },
  "login.signing_in": { en: "Signing in...", tr: "Giriş yapılıyor...", ar: "جاري تسجيل الدخول..." },
  "login.demo": { en: "Demo Accounts", tr: "Demo Hesaplar", ar: "حسابات تجريبية" },
  "login.password_all": { en: "Password for all: Test123!", tr: "Tüm şifreler: Test123!", ar: "كلمة المرور للجميع: Test123!" },

  // ─── Sidebar Navigation ───
  "nav.dashboard": { en: "Dashboard", tr: "Kontrol Paneli", ar: "لوحة القيادة" },
  "nav.employees": { en: "Employees", tr: "Çalışanlar", ar: "الموظفون" },
  "nav.attendance": { en: "Attendance", tr: "Yoklama", ar: "الحضور" },
  "nav.leave": { en: "Leave Mgmt", tr: "İzin Yönetimi", ar: "إدارة الإجازات" },
  "nav.approvals": { en: "Approvals", tr: "Onaylar", ar: "الموافقات" },
  "nav.disciplinary": { en: "Disciplinary", tr: "Disiplin", ar: "الإجراءات التأديبية" },
  "nav.documents": { en: "Documents", tr: "Belgeler", ar: "المستندات" },
  "nav.payroll": { en: "Payroll", tr: "Bordro", ar: "كشوف المرتبات" },
  "nav.sections": { en: "Sections", tr: "Bölümler", ar: "الأقسام" },
  "nav.settings": { en: "Settings", tr: "Ayarlar", ar: "الإعدادات" },
  "nav.signout": { en: "Sign Out", tr: "Çıkış Yap", ar: "تسجيل الخروج" },

  // ─── Roles ───
  "role.admin": { en: "System Admin", tr: "Sistem Yöneticisi", ar: "مدير النظام" },
  "role.hr_manager": { en: "HR Manager", tr: "İK Müdürü", ar: "مدير الموارد البشرية" },
  "role.hr_employee": { en: "HR Personnel", tr: "İK Personeli", ar: "موظف الموارد البشرية" },
  "role.section_manager": { en: "Section Manager", tr: "Bölüm Müdürü", ar: "مدير القسم" },

  // ─── Dashboard ───
  "dash.title": { en: "Dashboard", tr: "Kontrol Paneli", ar: "لوحة القيادة" },
  "dash.total_employees": { en: "Total Employees", tr: "Toplam Çalışan", ar: "إجمالي الموظفين" },
  "dash.clocked_in": { en: "Clocked In", tr: "Giriş Yapan", ar: "مسجل الحضور" },
  "dash.on_leave": { en: "On Leave", tr: "İzinli", ar: "في إجازة" },
  "dash.absent": { en: "Absent", tr: "Devamsız", ar: "غائب" },
  "dash.section_headcounts": { en: "Section Headcounts", tr: "Bölüm Mevcutları", ar: "أعداد الأقسام" },

  // ─── Employees ───
  "emp.title": { en: "Employee Management", tr: "Çalışan Yönetimi", ar: "إدارة الموظفين" },
  "emp.search": { en: "Search by name or ID...", tr: "İsim veya ID ile ara...", ar: "البحث بالاسم أو الرقم..." },
  "emp.all_sections": { en: "All Sections", tr: "Tüm Bölümler", ar: "جميع الأقسام" },
  "emp.all_status": { en: "All Status", tr: "Tüm Durumlar", ar: "جميع الحالات" },
  "emp.add": { en: "+ Add Employee", tr: "+ Çalışan Ekle", ar: "+ إضافة موظف" },
  "emp.employee": { en: "Employee", tr: "Çalışan", ar: "الموظف" },
  "emp.section": { en: "Section", tr: "Bölüm", ar: "القسم" },
  "emp.position": { en: "Position", tr: "Pozisyon", ar: "المنصب" },
  "emp.status": { en: "Status", tr: "Durum", ar: "الحالة" },
  "emp.performance": { en: "Performance", tr: "Performans", ar: "الأداء" },
  "emp.leave_bal": { en: "Leave", tr: "İzin", ar: "الإجازة" },
  "emp.found": { en: "employees found", tr: "çalışan bulundu", ar: "موظف تم العثور عليهم" },

  // ─── Employee Detail ───
  "empd.info": { en: "Info", tr: "Bilgi", ar: "معلومات" },
  "empd.documents": { en: "Documents", tr: "Belgeler", ar: "المستندات" },
  "empd.leave": { en: "Leave", tr: "İzin", ar: "الإجازة" },
  "empd.disciplinary": { en: "Disciplinary", tr: "Disiplin", ar: "تأديبي" },
  "empd.salary": { en: "Salary", tr: "Maaş", ar: "الراتب" },
  "empd.full_name": { en: "Full Name", tr: "Ad Soyad", ar: "الاسم الكامل" },
  "empd.tc_no": { en: "TC Kimlik No", tr: "TC Kimlik No", ar: "رقم الهوية" },
  "empd.phone": { en: "Phone", tr: "Telefon", ar: "الهاتف" },
  "empd.start_date": { en: "Start Date", tr: "Başlangıç Tarihi", ar: "تاريخ البدء" },
  "empd.total": { en: "Total", tr: "Toplam", ar: "الإجمالي" },
  "empd.used": { en: "Used", tr: "Kullanılan", ar: "المستخدم" },
  "empd.remaining": { en: "Remaining", tr: "Kalan", ar: "المتبقي" },
  "empd.gross_salary": { en: "Monthly Gross Salary", tr: "Aylık Brüt Maaş", ar: "الراتب الشهري الإجمالي" },
  "empd.net_approx": { en: "Net approx", tr: "Net yaklaşık", ar: "صافي تقريبي" },
  "empd.ssk": { en: "SSK Premium", tr: "SSK Primi", ar: "قسط التأمين" },
  "empd.tax": { en: "Income Tax", tr: "Gelir Vergisi", ar: "ضريبة الدخل" },
  "empd.no_docs": { en: "No documents uploaded.", tr: "Belge yüklenmedi.", ar: "لم يتم رفع مستندات." },
  "empd.no_disc": { en: "No disciplinary records.", tr: "Disiplin kaydı yok.", ar: "لا توجد سجلات تأديبية." },
  "empd.no_leave": { en: "No leave requests.", tr: "İzin talebi yok.", ar: "لا توجد طلبات إجازة." },

  // ─── Add Employee ───
  "add.title": { en: "Add New Employee", tr: "Yeni Çalışan Ekle", ar: "إضافة موظف جديد" },
  "add.requires_approval": { en: "Requires HR Manager approval", tr: "İK Müdürü onayı gerekir", ar: "يتطلب موافقة مدير الموارد البشرية" },
  "add.immediate": { en: "Employee will be added immediately", tr: "Çalışan hemen eklenecek", ar: "سيتم إضافة الموظف فوراً" },
  "add.personal": { en: "Personal Information", tr: "Kişisel Bilgiler", ar: "المعلومات الشخصية" },
  "add.employment": { en: "Employment Details", tr: "İstihdam Detayları", ar: "تفاصيل التوظيف" },
  "add.first_name": { en: "First Name", tr: "Ad", ar: "الاسم الأول" },
  "add.last_name": { en: "Last Name", tr: "Soyad", ar: "اسم العائلة" },
  "add.tc": { en: "TC Kimlik No", tr: "TC Kimlik No", ar: "رقم الهوية" },
  "add.phone": { en: "Phone", tr: "Telefon", ar: "الهاتف" },
  "add.email": { en: "Email", tr: "E-posta", ar: "البريد الإلكتروني" },
  "add.dob": { en: "Date of Birth", tr: "Doğum Tarihi", ar: "تاريخ الميلاد" },
  "add.gender": { en: "Gender", tr: "Cinsiyet", ar: "الجنس" },
  "add.male": { en: "Male", tr: "Erkek", ar: "ذكر" },
  "add.female": { en: "Female", tr: "Kadın", ar: "أنثى" },
  "add.blood": { en: "Blood Type", tr: "Kan Grubu", ar: "فصيلة الدم" },
  "add.address": { en: "Address", tr: "Adres", ar: "العنوان" },
  "add.emergency": { en: "Emergency Contact", tr: "Acil Durum İletişim", ar: "جهة اتصال الطوارئ" },
  "add.section": { en: "Section", tr: "Bölüm", ar: "القسم" },
  "add.position": { en: "Position", tr: "Pozisyon", ar: "المنصب" },
  "add.salary": { en: "Monthly Gross Salary (TRY)", tr: "Aylık Brüt Maaş (TL)", ar: "الراتب الشهري الإجمالي (ليرة)" },
  "add.cancel": { en: "Cancel", tr: "İptal", ar: "إلغاء" },
  "add.submit": { en: "Add Employee", tr: "Çalışan Ekle", ar: "إضافة موظف" },
  "add.submit_approval": { en: "Submit for Approval", tr: "Onaya Gönder", ar: "إرسال للموافقة" },
  "add.required": { en: "Fields marked with * are required", tr: "* işaretli alanlar zorunludur", ar: "الحقول المميزة بـ * مطلوبة" },
  "add.success": { en: "Employee Added Successfully", tr: "Çalışan Başarıyla Eklendi", ar: "تمت إضافة الموظف بنجاح" },
  "add.pending": { en: "Submitted for Approval", tr: "Onaya Gönderildi", ar: "تم الإرسال للموافقة" },
  "add.another": { en: "Add Another Employee", tr: "Başka Çalışan Ekle", ar: "إضافة موظف آخر" },
  "add.back": { en: "Back to Employees", tr: "Çalışanlara Dön", ar: "العودة للموظفين" },

  // ─── Attendance ───
  "att.title": { en: "Attendance & Headcount", tr: "Yoklama ve Mevcut", ar: "الحضور والأعداد" },
  "att.live": { en: "Live overview", tr: "Canlı görünüm", ar: "عرض مباشر" },
  "att.clocked_in": { en: "Clocked In", tr: "Giriş Yapan", ar: "مسجل الحضور" },
  "att.not_clocked": { en: "Not Clocked In", tr: "Giriş Yapmayan", ar: "غير مسجل" },
  "att.on_leave": { en: "On Leave", tr: "İzinli", ar: "في إجازة" },
  "att.clock_in": { en: "Clock In", tr: "Giriş", ar: "تسجيل حضور" },
  "att.clock_out": { en: "Clock Out", tr: "Çıkış", ar: "تسجيل انصراف" },
  "att.show_all": { en: "Show All", tr: "Tümünü Göster", ar: "عرض الكل" },
  "att.employee_list": { en: "Employee List", tr: "Çalışan Listesi", ar: "قائمة الموظفين" },
  "att.action": { en: "Action", tr: "İşlem", ar: "إجراء" },
  "att.clock_status": { en: "Clock Status", tr: "Giriş Durumu", ar: "حالة الحضور" },

  // ─── Leave ───
  "leave.title": { en: "Leave Management", tr: "İzin Yönetimi", ar: "إدارة الإجازات" },
  "leave.balances": { en: "Leave Balances", tr: "İzin Bakiyeleri", ar: "أرصدة الإجازات" },
  "leave.requests": { en: "Leave Requests", tr: "İzin Talepleri", ar: "طلبات الإجازات" },
  "leave.approve": { en: "Approve", tr: "Onayla", ar: "موافقة" },
  "leave.reject": { en: "Reject", tr: "Reddet", ar: "رفض" },
  "leave.no_requests": { en: "No leave requests found.", tr: "İzin talebi bulunamadı.", ar: "لم يتم العثور على طلبات إجازة." },

  // ─── Disciplinary ───
  "disc.title": { en: "Disciplinary Records", tr: "Disiplin Kayıtları", ar: "السجلات التأديبية" },
  "disc.new": { en: "+ New Record", tr: "+ Yeni Kayıt", ar: "+ سجل جديد" },
  "disc.log": { en: "Log Disciplinary Action", tr: "Disiplin İşlemi Kaydet", ar: "تسجيل إجراء تأديبي" },
  "disc.employee": { en: "Employee", tr: "Çalışan", ar: "الموظف" },
  "disc.type": { en: "Type", tr: "Tür", ar: "النوع" },
  "disc.reason": { en: "Reason", tr: "Sebep", ar: "السبب" },
  "disc.details": { en: "Details", tr: "Detaylar", ar: "التفاصيل" },
  "disc.witnesses": { en: "Witnesses", tr: "Tanıklar", ar: "الشهود" },
  "disc.submit": { en: "Submit Record", tr: "Kaydı Gönder", ar: "إرسال السجل" },
  "disc.no_records": { en: "No disciplinary records found.", tr: "Disiplin kaydı bulunamadı.", ar: "لم يتم العثور على سجلات تأديبية." },
  "disc.verbal": { en: "Verbal Warning", tr: "Sözlü Uyarı", ar: "تحذير شفهي" },
  "disc.written": { en: "Written Warning", tr: "Yazılı Uyarı", ar: "تحذير كتابي" },
  "disc.final": { en: "Final Warning", tr: "Son Uyarı", ar: "تحذير نهائي" },
  "disc.suspension": { en: "Suspension", tr: "Uzaklaştırma", ar: "إيقاف" },
  "disc.termination": { en: "Termination", tr: "İş Akdi Feshi", ar: "إنهاء الخدمة" },

  // ─── Documents ───
  "docs.title": { en: "Document Center", tr: "Belge Merkezi", ar: "مركز المستندات" },
  "docs.upload": { en: "+ Upload Document", tr: "+ Belge Yükle", ar: "+ رفع مستند" },
  "docs.upload_title": { en: "Upload Document", tr: "Belge Yükle", ar: "رفع مستند" },
  "docs.name": { en: "Document Name", tr: "Belge Adı", ar: "اسم المستند" },
  "docs.type": { en: "Type", tr: "Tür", ar: "النوع" },
  "docs.uploaded": { en: "Uploaded", tr: "Yüklenme", ar: "تاريخ الرفع" },
  "docs.contract": { en: "Contract", tr: "Sözleşme", ar: "عقد" },
  "docs.id_copy": { en: "ID Copy", tr: "Kimlik Fotokopisi", ar: "نسخة الهوية" },
  "docs.diploma": { en: "Diploma", tr: "Diploma", ar: "شهادة" },
  "docs.health": { en: "Health Report", tr: "Sağlık Raporu", ar: "تقرير صحي" },
  "docs.other": { en: "Other", tr: "Diğer", ar: "أخرى" },
  "docs.drag": { en: "Drag and drop or click to upload", tr: "Sürükle bırak veya tıkla", ar: "اسحب وأفلت أو انقر للرفع" },
  "docs.search": { en: "Search by employee or document name...", tr: "Çalışan veya belge adı ile ara...", ar: "البحث بالموظف أو اسم المستند..." },

  // ─── Payroll ───
  "pay.title": { en: "Payroll Overview", tr: "Bordro Özeti", ar: "نظرة عامة على الرواتب" },
  "pay.total": { en: "Total Monthly Payroll", tr: "Toplam Aylık Bordro", ar: "إجمالي الرواتب الشهرية" },
  "pay.average": { en: "Average Salary", tr: "Ortalama Maaş", ar: "متوسط الراتب" },
  "pay.net_total": { en: "Total Net (approx)", tr: "Toplam Net (yaklaşık)", ar: "إجمالي صافي (تقريبي)" },
  "pay.per_emp": { en: "Per employee", tr: "Çalışan başına", ar: "لكل موظف" },
  "pay.after_ded": { en: "After deductions", tr: "Kesintiler sonrası", ar: "بعد الخصومات" },
  "pay.gross": { en: "Gross", tr: "Brüt", ar: "إجمالي" },
  "pay.ssk": { en: "SSK (14%)", tr: "SSK (%14)", ar: "تأمين (14%)" },
  "pay.tax": { en: "Tax (15%)", tr: "Vergi (%15)", ar: "ضريبة (15%)" },
  "pay.net": { en: "Net (approx)", tr: "Net (yaklaşık)", ar: "صافي (تقريبي)" },

  // ─── Sections ───
  "sec.title": { en: "Factory Sections", tr: "Fabrika Bölümleri", ar: "أقسام المصنع" },
  "sec.departments": { en: "departments", tr: "bölüm", ar: "أقسام" },
  "sec.total": { en: "Total", tr: "Toplam", ar: "الإجمالي" },
  "sec.clocked_in": { en: "Clocked In", tr: "Giriş Yapan", ar: "مسجل حضور" },
  "sec.avg_perf": { en: "Avg Performance", tr: "Ort. Performans", ar: "متوسط الأداء" },
  "sec.payroll": { en: "Section Payroll", tr: "Bölüm Bordrosu", ar: "رواتب القسم" },

  // ─── Settings ───
  "set.title": { en: "System Settings", tr: "Sistem Ayarları", ar: "إعدادات النظام" },
  "set.admin_only": { en: "Admin only", tr: "Sadece yönetici", ar: "المدير فقط" },
  "set.users": { en: "System Users", tr: "Sistem Kullanıcıları", ar: "مستخدمو النظام" },
  "set.platform": { en: "Platform Info", tr: "Platform Bilgisi", ar: "معلومات المنصة" },
  "set.sections": { en: "Factory Sections", tr: "Fabrika Bölümleri", ar: "أقسام المصنع" },

  // ─── Approvals ───
  "appr.title": { en: "Approvals & History", tr: "Onaylar ve Geçmiş", ar: "الموافقات والسجل" },
  "appr.pending": { en: "Pending", tr: "Bekleyen", ar: "قيد الانتظار" },
  "appr.history": { en: "History", tr: "Geçmiş", ar: "السجل" },
  "appr.approve": { en: "Approve", tr: "Onayla", ar: "موافقة" },
  "appr.reject": { en: "Reject", tr: "Reddet", ar: "رفض" },
  "appr.all_caught": { en: "All caught up!", tr: "Hepsi tamam!", ar: "لا يوجد شيء معلق!" },
  "appr.no_pending": { en: "No pending approvals.", tr: "Bekleyen onay yok.", ar: "لا توجد موافقات معلقة." },
  "appr.no_history": { en: "No history records yet.", tr: "Henüz geçmiş kaydı yok.", ar: "لا توجد سجلات سابقة." },
  "appr.new_employee": { en: "New Employee", tr: "Yeni Çalışan", ar: "موظف جديد" },
  "appr.leave_request": { en: "Leave Request", tr: "İzin Talebi", ar: "طلب إجازة" },
  "appr.record_details": { en: "Record Details", tr: "Kayıt Detayları", ar: "تفاصيل السجل" },
  "appr.requested_by": { en: "Requested By", tr: "Talep Eden", ar: "مقدم الطلب" },
  "appr.request_date": { en: "Request Date", tr: "Talep Tarihi", ar: "تاريخ الطلب" },
  "appr.reviewed_by": { en: "Reviewed By", tr: "Değerlendiren", ar: "المراجع" },
  "appr.review_date": { en: "Review Date", tr: "Değerlendirme Tarihi", ar: "تاريخ المراجعة" },
  "appr.rejection_reason": { en: "Rejection Reason", tr: "Red Sebebi", ar: "سبب الرفض" },
  "appr.approval_note": { en: "Approval Note", tr: "Onay Notu", ar: "ملاحظة الموافقة" },
  "appr.reason_category": { en: "Reason Category", tr: "Sebep Kategorisi", ar: "فئة السبب" },
  "appr.additional": { en: "Additional Details", tr: "Ek Detaylar", ar: "تفاصيل إضافية" },
  "appr.confirm_reject": { en: "Confirm Rejection", tr: "Reddi Onayla", ar: "تأكيد الرفض" },
  "appr.close": { en: "Close", tr: "Kapat", ar: "إغلاق" },

  // ─── Rejection Reasons - Leave ───
  "rej.leave.balance": { en: "Insufficient leave balance", tr: "Yetersiz izin bakiyesi", ar: "رصيد إجازات غير كافٍ" },
  "rej.leave.busy": { en: "Busy period - coverage needed", tr: "Yoğun dönem - kapsama gerekli", ar: "فترة مزدحمة - تغطية مطلوبة" },
  "rej.leave.too_many": { en: "Too many employees on leave", tr: "Çok fazla çalışan izinde", ar: "عدد كبير من الموظفين في إجازة" },
  "rej.leave.conflict": { en: "Request conflicts with schedule", tr: "Talep programla çakışıyor", ar: "الطلب يتعارض مع الجدول" },
  "rej.leave.late": { en: "Submitted too late", tr: "Çok geç gönderildi", ar: "تم التقديم متأخراً" },
  "rej.leave.other": { en: "Other", tr: "Diğer", ar: "أخرى" },

  // ─── Rejection Reasons - Employee ───
  "rej.emp.docs": { en: "Incomplete documentation", tr: "Eksik belgeler", ar: "مستندات غير مكتملة" },
  "rej.emp.filled": { en: "Position already filled", tr: "Pozisyon zaten dolu", ar: "المنصب مشغول" },
  "rej.emp.budget": { en: "Budget constraints", tr: "Bütçe kısıtlamaları", ar: "قيود الميزانية" },
  "rej.emp.background": { en: "Failed background check", tr: "Geçmiş kontrolü başarısız", ar: "فشل التحقق من الخلفية" },
  "rej.emp.qualifications": { en: "Qualifications not met", tr: "Nitelikler yetersiz", ar: "المؤهلات غير مستوفاة" },
  "rej.emp.other": { en: "Other", tr: "Diğer", ar: "أخرى" },

  // ─── Status Labels ───
  "status.active": { en: "Active", tr: "Aktif", ar: "نشط" },
  "status.on_leave": { en: "On Leave", tr: "İzinli", ar: "في إجازة" },
  "status.absent": { en: "Absent", tr: "Devamsız", ar: "غائب" },
  "status.suspended": { en: "Suspended", tr: "Uzaklaştırılmış", ar: "موقوف" },
  "status.terminated": { en: "Terminated", tr: "İş Akdi Feshedilmiş", ar: "منتهي الخدمة" },
  "status.approved": { en: "Approved", tr: "Onaylandı", ar: "تمت الموافقة" },
  "status.rejected": { en: "Rejected", tr: "Reddedildi", ar: "مرفوض" },
  "status.pending": { en: "Pending", tr: "Beklemede", ar: "قيد الانتظار" },
  "status.resolved": { en: "Resolved", tr: "Çözüldü", ar: "تم الحل" },

  // ─── Common ───
  "common.cancel": { en: "Cancel", tr: "İptal", ar: "إلغاء" },
  "common.save": { en: "Save", tr: "Kaydet", ar: "حفظ" },
  "common.select": { en: "Select", tr: "Seçin", ar: "اختر" },
  "common.loading": { en: "Loading...", tr: "Yükleniyor...", ar: "جاري التحميل..." },
  "common.coming_soon": { en: "Coming Soon", tr: "Yakında", ar: "قريباً" },
  "common.employees": { en: "employees", tr: "çalışan", ar: "موظفين" },
  "common.days": { en: "days", tr: "gün", ar: "أيام" },
  "common.language": { en: "Language", tr: "Dil", ar: "اللغة" },

  // ─── Section Names ───
  "section.confection": { en: "Confection", tr: "Konfeksiyon", ar: "الخياطة" },
  "section.dyehouse": { en: "Dyehouse", tr: "Boyahane", ar: "صباغة" },
  "section.weaving": { en: "Weaving", tr: "Dokuma", ar: "النسيج" },
  "section.sizing": { en: "Sizing", tr: "Haşıl", ar: "التجهيز" },
  "section.storage": { en: "Storage", tr: "Depo", ar: "المخزن" },
  "section.security": { en: "Security", tr: "Güvenlik", ar: "الأمن" },
  "section.quality_control": { en: "Quality Control", tr: "Kalite Kontrol", ar: "مراقبة الجودة" },
  "section.maintenance": { en: "Maintenance", tr: "Bakım", ar: "الصيانة" },

  // ─── Validation Errors ───
  "err.first_name": { en: "First name is required", tr: "Ad zorunludur", ar: "الاسم الأول مطلوب" },
  "err.last_name": { en: "Last name is required", tr: "Soyad zorunludur", ar: "اسم العائلة مطلوب" },
  "err.tc": { en: "TC Kimlik No must be 11 digits and cannot start with 0", tr: "TC Kimlik No 11 haneli olmalı ve 0 ile başlayamaz", ar: "رقم الهوية يجب أن يكون 11 رقماً ولا يبدأ بـ 0" },
  "err.tc_required": { en: "TC Kimlik No is required", tr: "TC Kimlik No zorunludur", ar: "رقم الهوية مطلوب" },
  "err.tc_exists": { en: "This TC Kimlik No is already registered", tr: "Bu TC Kimlik No zaten kayıtlı", ar: "رقم الهوية مسجل بالفعل" },
  "err.phone": { en: "Phone number is required", tr: "Telefon numarası zorunludur", ar: "رقم الهاتف مطلوب" },
  "err.phone_invalid": { en: "Enter a valid phone number", tr: "Geçerli bir telefon numarası girin", ar: "أدخل رقم هاتف صحيح" },
  "err.section": { en: "You must select a section", tr: "Bölüm seçmelisiniz", ar: "يجب اختيار قسم" },
  "err.position": { en: "Job position is required", tr: "Pozisyon zorunludur", ar: "المنصب مطلوب" },
  "err.salary": { en: "Salary must be greater than 0", tr: "Maaş 0'dan büyük olmalı", ar: "الراتب يجب أن يكون أكبر من 0" },
  "err.gender": { en: "Gender is required", tr: "Cinsiyet zorunludur", ar: "الجنس مطلوب" },
  "err.emergency": { en: "Emergency contact is required", tr: "Acil durum iletişim zorunludur", ar: "جهة اتصال الطوارئ مطلوبة" },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
  dir: "ltr",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("nur-nil-lang") as Lang;
    if (saved && ["en", "tr", "ar"].includes(saved)) setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("nur-nil-lang", l);
  }

  function t(key: string): string {
    return translations[key]?.[lang] || translations[key]?.["en"] || key;
  }

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const langs: { code: Lang; label: string; flag: string }[] = [
    { code: "en", label: "EN", flag: "English" },
    { code: "tr", label: "TR", flag: "Türkçe" },
    { code: "ar", label: "AR", flag: "العربية" },
  ];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {langs.map((l) => (
        <button key={l.code} onClick={() => setLang(l.code)} title={l.flag} style={{
          padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif",
          background: lang === l.code ? "rgba(59,130,246,0.12)" : "transparent",
          border: lang === l.code ? "1px solid rgba(59,130,246,0.2)" : "1px solid #252b38",
          color: lang === l.code ? "#3b82f6" : "#5c6478",
        }}>{l.label}</button>
      ))}
    </div>
  );
}

export const useTranslation = useI18n;
