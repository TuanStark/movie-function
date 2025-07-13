import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    // Get current date for time-based calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel execution of all statistics queries
    const [
      totalUsers,
      totalMovies,
      totalBookings,
      totalRevenue,
      usersThisMonth,
      usersLastMonth,
      bookingsThisMonth,
      bookingsLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      moviesThisMonth,
      moviesLastMonth,
      topMovies,
      recentBookings,
      bookingsByStatus,
      revenueByMonth,
      usersByRole,
      topTheaters,
    ] = await Promise.all([
      // Total counts
      this.prisma.user.count(),
      this.prisma.movie.count(),
      this.prisma.booking.count(),
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'CONFIRMED' }
      }),

      // This month vs last month comparisons
      this.prisma.user.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      this.prisma.user.count({
        where: { 
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth 
          } 
        }
      }),
      this.prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      this.prisma.booking.count({
        where: { 
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth 
          } 
        }
      }),
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { 
          status: 'CONFIRMED',
          createdAt: { gte: startOfMonth }
        }
      }),
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { 
          status: 'CONFIRMED',
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth 
          }
        }
      }),
      this.prisma.movie.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      this.prisma.movie.count({
        where: { 
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth 
          } 
        }
      }),

      // Top movies by booking count
      this.prisma.movie.findMany({
        take: 5,
        include: {
          _count: {
            select: { showtimes: { where: { bookings: { some: {} } } } }
          },
          showtimes: {
            include: {
              bookings: {
                where: { status: 'CONFIRMED' },
                select: { totalPrice: true }
              }
            }
          }
        },
        orderBy: {
          showtimes: {
            _count: 'desc'
          }
        }
      }),

      // Recent bookings
      this.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          },
          showtime: {
            include: {
              movie: { select: { title: true } },
              theater: { select: { name: true } }
            }
          }
        }
      }),

      // Bookings by status
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true }
      }),

      // Revenue by month (last 6 months)
      this.getRevenueByMonth(),

      // Users by role
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),

      // Top theaters by booking count
      this.prisma.theater.findMany({
        take: 5,
        include: {
          _count: {
            select: { 
              showtimes: { 
                where: { 
                  bookings: { some: { status: 'CONFIRMED' } } 
                } 
              } 
            }
          }
        },
        orderBy: {
          showtimes: {
            _count: 'desc'
          }
        }
      })
    ]);

    // Calculate percentage changes
    const userGrowth = this.calculateGrowthPercentage(usersThisMonth, usersLastMonth);
    const bookingGrowth = this.calculateGrowthPercentage(bookingsThisMonth, bookingsLastMonth);
    const revenueGrowth = this.calculateGrowthPercentage(
      revenueThisMonth._sum.totalPrice || 0,
      revenueLastMonth._sum.totalPrice || 0
    );
    const movieGrowth = this.calculateGrowthPercentage(moviesThisMonth, moviesLastMonth);

    return {
      overview: {
        totalUsers: {
          count: totalUsers,
          growth: userGrowth,
          thisMonth: usersThisMonth
        },
        totalMovies: {
          count: totalMovies,
          growth: movieGrowth,
          thisMonth: moviesThisMonth
        },
        totalBookings: {
          count: totalBookings,
          growth: bookingGrowth,
          thisMonth: bookingsThisMonth
        },
        totalRevenue: {
          amount: totalRevenue._sum.totalPrice || 0,
          growth: revenueGrowth,
          thisMonth: revenueThisMonth._sum.totalPrice || 0
        }
      },
      charts: {
        revenueByMonth,
        bookingsByStatus: bookingsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count.role
        }))
      },
      topMovies: topMovies.map(movie => ({
        id: movie.id,
        title: movie.title,
        posterPath: movie.posterPath,
        rating: movie.rating,
        bookingCount: movie.showtimes.reduce((total, showtime) => 
          total + showtime.bookings.length, 0
        ),
        revenue: movie.showtimes.reduce((total, showtime) => 
          total + showtime.bookings.reduce((sum, booking) => 
            sum + booking.totalPrice, 0
          ), 0
        )
      })),
      topTheaters: topTheaters.map(theater => ({
        id: theater.id,
        name: theater.name,
        location: theater.location,
        bookingCount: theater._count.showtimes
      })),
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        bookingCode: booking.bookingCode,
        customerName: `${booking.user.firstName} ${booking.user.lastName}`,
        movieTitle: booking.showtime.movie.title,
        theaterName: booking.showtime.theater.name,
        totalPrice: booking.totalPrice,
        status: booking.status,
        createdAt: booking.createdAt
      }))
    };
  }

  private async getRevenueByMonth() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueData = await this.prisma.booking.groupBy({
      by: ['createdAt'],
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: sixMonthsAgo }
      },
      _sum: { totalPrice: true }
    });

    // Group by month and format
    const monthlyRevenue = new Map();
    
    revenueData.forEach(item => {
      const month = new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM format
      const current = monthlyRevenue.get(month) || 0;
      monthlyRevenue.set(month, current + (item._sum.totalPrice || 0));
    });

    // Convert to array and sort
    return Array.from(monthlyRevenue.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  async getMovieStats() {
    const [
      totalMovies,
      upcomingMovies,
      currentMovies,
      moviesByGenre,
      averageRating,
      topRatedMovies
    ] = await Promise.all([
      this.prisma.movie.count(),
      this.prisma.movie.count({ where: { upcoming: true } }),
      this.prisma.movie.count({ where: { upcoming: false } }),
      this.prisma.movieGenre.groupBy({
        by: ['genreId'],
        _count: { genreId: true }
      }),
      this.prisma.movie.aggregate({
        _avg: { rating: true }
      }),
      this.prisma.movie.findMany({
        take: 10,
        orderBy: { rating: 'desc' },
        select: {
          id: true,
          title: true,
          rating: true,
          posterPath: true
        }
      })
    ]);

    // Get genre names for the moviesByGenre data
    const genreIds = moviesByGenre.map(item => item.genreId);
    const genres = await this.prisma.genre.findMany({
      where: { id: { in: genreIds } },
      select: { id: true, name: true }
    });

    // Combine genre data with counts
    const moviesByGenreWithNames = moviesByGenre.map(item => {
      const genre = genres.find(g => g.id === item.genreId);
      return {
        genreId: item.genreId,
        count: item._count.genreId,
        genre: genre ? { name: genre.name } : null
      };
    });

    return {
      overview: {
        total: totalMovies,
        upcoming: upcomingMovies,
        current: currentMovies,
        averageRating: averageRating._avg.rating || 0
      },
      moviesByGenre: moviesByGenreWithNames,
      topRatedMovies
    };
  }

  async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentUsers
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { status: 'unactive' } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true
        }
      })
    ]);

    return {
      overview: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers
      },
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count.role
      })),
      recentUsers
    };
  }

  async getBookingStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBookings,
      todayBookings,
      weekBookings,
      monthBookings,
      bookingsByPaymentMethod,
      bookingsByStatus,
      averageBookingValue,
      peakHours
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: { createdAt: { gte: startOfToday } }
      }),
      this.prisma.booking.count({
        where: { createdAt: { gte: startOfWeek } }
      }),
      this.prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      this.prisma.booking.groupBy({
        by: ['paymentMethod'],
        _count: { paymentMethod: true },
        _sum: { totalPrice: true }
      }),
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      this.prisma.booking.aggregate({
        _avg: { totalPrice: true },
        where: { status: 'CONFIRMED' }
      }),
      this.getBookingsByHour()
    ]);

    return {
      overview: {
        total: totalBookings,
        today: todayBookings,
        thisWeek: weekBookings,
        thisMonth: monthBookings,
        averageValue: averageBookingValue._avg.totalPrice || 0
      },
      bookingsByPaymentMethod: bookingsByPaymentMethod.map(item => ({
        method: item.paymentMethod,
        count: item._count.paymentMethod,
        revenue: item._sum.totalPrice || 0
      })),
      bookingsByStatus: bookingsByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      peakHours
    };
  }

  private async getBookingsByHour() {
    const bookings = await this.prisma.booking.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: { createdAt: true }
    });

    const hourCounts = new Array(24).fill(0);

    bookings.forEach(booking => {
      const hour = booking.createdAt.getHours();
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      bookings: count
    }));
  }

  async getRevenueStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
      revenueByTheater,
      revenueByMovie
    ] = await Promise.all([
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'CONFIRMED' }
      }),
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startOfToday }
        }
      }),
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startOfWeek }
        }
      }),
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startOfMonth }
        }
      }),
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startOfYear }
        }
      }),
      this.getRevenueByTheater(),
      this.getRevenueByMovie()
    ]);

    return {
      overview: {
        total: totalRevenue._sum.totalPrice || 0,
        today: todayRevenue._sum.totalPrice || 0,
        thisWeek: weekRevenue._sum.totalPrice || 0,
        thisMonth: monthRevenue._sum.totalPrice || 0,
        thisYear: yearRevenue._sum.totalPrice || 0
      },
      revenueByTheater,
      revenueByMovie
    };
  }

  private async getRevenueByTheater() {
    const theaters = await this.prisma.theater.findMany({
      include: {
        showtimes: {
          include: {
            bookings: {
              where: { status: 'CONFIRMED' },
              select: { totalPrice: true }
            }
          }
        }
      }
    });

    return theaters.map(theater => ({
      id: theater.id,
      name: theater.name,
      location: theater.location,
      revenue: theater.showtimes.reduce((total, showtime) =>
        total + showtime.bookings.reduce((sum, booking) =>
          sum + booking.totalPrice, 0
        ), 0
      ),
      bookingCount: theater.showtimes.reduce((total, showtime) =>
        total + showtime.bookings.length, 0
      )
    })).sort((a, b) => b.revenue - a.revenue);
  }

  private async getRevenueByMovie() {
    const movies = await this.prisma.movie.findMany({
      include: {
        showtimes: {
          include: {
            bookings: {
              where: { status: 'CONFIRMED' },
              select: { totalPrice: true }
            }
          }
        }
      }
    });

    return movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      revenue: movie.showtimes.reduce((total, showtime) =>
        total + showtime.bookings.reduce((sum, booking) =>
          sum + booking.totalPrice, 0
        ), 0
      ),
      bookingCount: movie.showtimes.reduce((total, showtime) =>
        total + showtime.bookings.length, 0
      )
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }
}
