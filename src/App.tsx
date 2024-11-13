import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import { GraduationCap } from 'lucide-react';
import { DashboardCard } from './components/DashboardCard';
import { FilterBar } from './components/FilterBar';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface AttendanceRecord {
  course: string;
  name: string;
  section: string;
  timings: string;
  timestamp: string;
}

function App() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const attendanceRef = ref(database, 'student-details');
    onValue(attendanceRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const records = Object.values(data) as AttendanceRecord[];
          setAttendanceData(records);
          setError(null);
        }
      } catch (err) {
        setError('Error loading attendance data');
        console.error(err);
      }
    });
  }, []);

  const filteredData = attendanceData.filter((record) => {
    try {
      const recordDate = format(new Date(record.timestamp), 'yyyy-MM-dd');
      const dateMatch = recordDate === selectedDate;
      const courseMatch = selectedCourse === 'All Courses' || record.course === selectedCourse;
      return dateMatch && courseMatch;
    } catch {
      return false;
    }
  });

  const courseData = {
    labels: ['Android', 'Patterns', 'GDP-1', 'Java', 'iOS', 'Web Applications', 'ADB'],
    datasets: [
      {
        data: ['Android', 'Patterns', 'GDP-1', 'Java', 'iOS', 'Web Applications', 'ADB'].map(
          (course) => filteredData.filter((record) => record.course === course).length
        ),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#47B39C',
        ],
      },
    ],
  };

  const timeData = {
    labels: [...new Set(filteredData.map((record) => record.timings))].sort(),
    datasets: [
      {
        label: 'Attendance by Time',
        data: [...new Set(filteredData.map((record) => record.timings))].sort().map(
          (time) => filteredData.filter((record) => record.timings === time).length
        ),
        backgroundColor: '#4BC0C0',
      },
    ],
  };

  const totalStudents = filteredData.length;
  const uniqueCourses = new Set(filteredData.map((record) => record.course)).size;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-red-600 text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-green-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Attendance Analytics Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <FilterBar
          selectedDate={selectedDate}
          selectedCourse={selectedCourse}
          onDateChange={setSelectedDate}
          onCourseChange={setSelectedCourse}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <DashboardCard title="Total Attendance">
            <div className="text-4xl font-bold text-green-600">{totalStudents}</div>
            <div className="text-sm text-gray-500">students present</div>
          </DashboardCard>
          
          <DashboardCard title="Active Courses">
            <div className="text-4xl font-bold text-blue-600">{uniqueCourses}</div>
            <div className="text-sm text-gray-500">courses with attendance</div>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard title="Attendance by Course">
            <div className="h-[300px] flex items-center justify-center">
              <Pie data={courseData} options={{ maintainAspectRatio: false }} />
            </div>
          </DashboardCard>

          <DashboardCard title="Attendance by Time">
            <div className="h-[300px]">
              <Bar
                data={timeData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </div>
          </DashboardCard>
        </div>
      </main>
    </div>
  );
}

export default App;