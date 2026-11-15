# Dấu vết bền của Pod đã chạy (dùng chung cho s22, s23): đọc journal của kubelet trên một worker (journald lưu trên đĩa,
# còn qua lần khởi động lại VM) và in mỗi lần kubelet chuẩn bị một volume emptyDir/hostPath cho Pod trong namespace shop:
#   <namespace/pod> <plugin> <tên volume> <UID của Pod>
# theo thứ tự thời gian. Với volume từ PVC, <tên volume> là tên PV (vd. shop-data, pvc-<uid>). Chỉ đọc.
sudo journalctl -u kubelet --no-pager -o cat 2>/dev/null | python3 -c '
import re, sys
pat = re.compile(r"VerifyControllerAttachedVolume started for volume \\\"([^\\\"]+)\\\" \(UniqueName: \\\"kubernetes\.io/(empty-dir|host-path)/([0-9a-f-]{36})-[^)]*\) pod \\\"[^\\\"]*\\\" \(UID: \\\"[0-9a-f-]{36}\\\"\) \" pod=\"(shop/[a-z0-9.-]+)\"")
for line in sys.stdin:
    m = pat.search(line)
    if m: print(m.group(4), m.group(2), m.group(1), m.group(3))
'
